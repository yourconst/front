import { BaseHelpers } from "./Base";
import { Sleeper } from "./Sleeper";
import { AsyncTask } from "./types/AsyncTask";

interface PeriodCountLimiterRunnerSettings {
    periodMaxTaskCount: number;
    periodSize?: number;
    maxWaitingTasks?: number;
    errors?: {
        sleepAllBeforeNextTry?: boolean;
        sleepMultiplier?: number;
        sleepTime?: number;
    };
}

class PeriodCountLimiterRunnerWaitRerunError {
    constructor(public error?: any) {}
}


export class PeriodCountLimiterRunner {
    static readonly WaitRerunError = PeriodCountLimiterRunnerWaitRerunError;
    readonly WaitRerunError = PeriodCountLimiterRunnerWaitRerunError;

    private settings: PeriodCountLimiterRunnerSettings;

    private currentPeriod = {
        startTime: 0,
        taskCount: 0,
    };
    private errorsCount = 0;

    private isUpdating = false;

    private activeTasks = new Set<AsyncTask>();
    private waitingTasks = new Array<AsyncTask>();

    private sleeper = new Sleeper().addListener(Sleeper.EVENTS.resume, () => this._tryUpdate());

    constructor(options: PeriodCountLimiterRunnerSettings) {
        this.settings = {
            periodMaxTaskCount: options.periodMaxTaskCount,
            periodSize: options.periodSize || 1000,
            maxWaitingTasks: options.maxWaitingTasks || 100,
            errors: {
                sleepAllBeforeNextTry: options.errors?.sleepAllBeforeNextTry || true,
                sleepMultiplier: options.errors?.sleepMultiplier ?? 1,
                sleepTime: options.errors?.sleepTime ?? 1000,
            },
        };
    }

    getNextPeriodTimeout() {
        return Math.max(
            0,
            this.settings.periodSize - (Date.now() - this.currentPeriod.startTime),
        );
    }

    private _tryIncrementTaskCount() {
        if (this.getNextPeriodTimeout() === 0) {
            this.currentPeriod.startTime = Date.now();
            this.currentPeriod.taskCount = 0;
        }

        if (this.currentPeriod.taskCount < this.settings.periodMaxTaskCount) {
            ++this.currentPeriod.taskCount;
            return true;
        } else {
            return false;
        }
    }

    private async _runTask(task: AsyncTask) {
        this.activeTasks.add(task);
        
        while (true) {
            const error = await task.runNoReject();

            if (error) {
                ++this.errorsCount;

                if (error instanceof PeriodCountLimiterRunnerWaitRerunError) {
                    if (this.settings.errors.sleepAllBeforeNextTry) {
                        await this.sleeper.sleep(this.settings.errors.sleepMultiplier * this.settings.errors.sleepTime);
                    }
                } else {
                    this.activeTasks.delete(task);
                    BaseHelpers.setImmediate(this._tryUpdate);
                    return;
                }
            } else {
                this.activeTasks.delete(task);
                this.errorsCount = 0;
                BaseHelpers.setImmediate(this._tryUpdate);
                return;
            }
        }
    }

    private _tryUpdate = async () => {
        if (this.sleeper.isPaused || this.isUpdating) {
            return;
        }

        try {
            this.isUpdating = true;

            while (this.waitingTasks.length) {
                if (this.sleeper.isPaused) {
                    return;
                }

                if (!this._tryIncrementTaskCount()) {
                    await BaseHelpers.sleep(this.getNextPeriodTimeout());
                }

                this._runTask(this.waitingTasks.shift());
            }
        } finally {
            this.isUpdating = false;
        }
    }
    

    async tryRunAndWait<T, P extends any[] = any[]>(
        worker: (...params: P) => Promise<T>,
        params?: P,
    ) {
        if (this.waitingTasks.length >= this.settings.maxWaitingTasks) {
            throw new Error(`Can't add new task`);
        }

        const task = new AsyncTask(worker, params);
        this.waitingTasks.push(task);
        this._tryUpdate();

        return task.promise;
    }
}

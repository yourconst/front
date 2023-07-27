import EventEmitter from 'eventemitter3';
import { BaseHelpers } from './Base';

enum EVENTS {
    pause = 'pause',
    resume = 'resume',
    statechange = 'statechange',
};

export class Sleeper extends EventEmitter<{
    [EVENTS.pause]: () => void;
    [EVENTS.resume]: () => void;
    [EVENTS.statechange]: (isPaused: boolean) => void;
}> {
    static readonly EVENTS = EVENTS;
    readonly EVENTS = EVENTS;

    private sleepInfo = {
        active: false,
        until: 0,
        promise: <Promise<void>> null,
    };

    private _isPaused = false;


    constructor(private throwOnRepausing = false) {
        super();
    }

    get isPaused() {
        return this._isPaused;
    }
    private set isPaused(value) {
        if (this._isPaused === value) {
            return;
        }

        this._isPaused = value;

        this.emit(EVENTS.statechange, this._isPaused);

        if (this._isPaused) {
            this.emit(EVENTS.pause);
        } else {
            this.emit(EVENTS.resume);
        }
    }


    pause() {
        if (this.throwOnRepausing && this._isPaused) {
            throw new Error('Sleeper already paused');
        }
        this.isPaused = true;
    }

    async resume() {
        await this.awaitSleepEnd();

        this.isPaused = false;
    }

    async awaitSleepEnd() {
        let promise: Promise<void>;

        while (this.sleepInfo.active && promise !== this.sleepInfo.promise) {
            promise = this.sleepInfo.promise;
            await promise;
        }
    }

    async sleep(ms: number) {
        this.pause();

        const until = Date.now() + ms;

        if (!this.sleepInfo.active || this.sleepInfo.until < until) {
            this.sleepInfo.active = true;
            this.sleepInfo.promise = BaseHelpers.sleep(ms);
            this.sleepInfo.until = until;
        }
        
        await this.awaitSleepEnd();
        this.sleepInfo.active = false;
        
        this.resume();
    }
}

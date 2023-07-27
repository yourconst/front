import { BaseHelpers } from "./Base";
import { PeriodCountLimiterRunner } from "./PeriodCountLimiterRunner";

export class FetchPeriodLimiter extends PeriodCountLimiterRunner {
    async fetch(input: RequestInfo | URL, init?: RequestInit, options: {
        noThrow?: boolean;
        checkResponseRerun?: (res: Response) => boolean;
        checkErrorRerun?: (error: any) => boolean;
    } = {}) {
        options.checkResponseRerun ??= (res) => {
            if (FetchHelpers.isResponseSuccess(res)) {
                return false;
            }

            if (FetchHelpers.isResponseFailedByLimit(res)) {
                return true;
            }

            return false;
        };

        try {
            return await this.tryRunAndWait(
                async (input: RequestInfo | URL, init?: RequestInit) => {
                    let res: Response;
                    let err: any;
                    try {
                        res = await fetch(input, init);
                    } catch (error) {
                        err = error;
                    }

                    if (res) {
                        // console.warn(res);
                        if (options.checkResponseRerun?.(res)) {
                            throw new this.WaitRerunError();
                        }
                        return res;
                    }

                    // console.warn(err);

                    if (options.checkErrorRerun?.(err)) {
                        throw new this.WaitRerunError();
                    }
                    throw err;
                },
                [input, init],
            );
        } catch (error) {
            if (options.noThrow) {
                return null;
            }
            throw error;
        }
    }
}

export class FetchHelpers {
    static readonly PeriodLimiter = FetchPeriodLimiter;

    static getResponseStatusType(res?: Response) {
        return Math.trunc((res?.status || -1) / 100);
    }

    static isResponseSuccess(res?: Response) {
        return FetchHelpers.getResponseStatusType(res) === 2;
    }

    static isResponseFailedByLimit(res?: Response) {
        return FetchHelpers.getResponseStatusType(res) === 5;
    }

    static async untilSuccess(options: {
        input: RequestInfo | URL;
        init?: RequestInit;
        maxCount?: number;
        delay?: number;
        noThrow?: boolean;
    }) {
        const { maxCount = 3, delay = 10000, input, init } = options;

        let error: any;
        let throwImmediately = false;

        for (let i = 0; i < maxCount; ++i) {
            try {
                const res = await fetch(input, init);

                const statusType = Math.trunc(res.status / 100);

                if (statusType === 2) {
                    return res;
                }

                console.warn(statusType, res.status, res.statusText);

                if (statusType === 4) {
                    throwImmediately = true;
                    throw res;
                }

                await BaseHelpers.sleep(delay);
                throw res;
            } catch (err) {
                error = err;
                if (throwImmediately) {
                    break;
                }
            }
        }

        if (options.noThrow) {
            return null;
        }
        throw error;
    }
}

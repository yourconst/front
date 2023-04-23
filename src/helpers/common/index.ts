class PromiseManaged<T = void> {
    private readonly _resolve: T extends void ? () => void : (res: T) => void;
    private readonly _reject: (err?: any) => void;
    readonly promise: Promise<T>;
    private _isResolved = false;

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            // @ts-ignore
            this._resolve = resolve;
            // @ts-ignore
            this._reject = reject;
        });
    }

    get isResolved() { return this._isResolved; }

    resolve(...params: T extends void ? [] : [T]) {
        this._isResolved = true;
        // @ts-ignore
        this._resolve(...params);
    }

    reject(err?: any) {
        this._isResolved = true;
        this._reject(err);
    }
}

class PromiseManagedTimeouted extends PromiseManaged<void> {
    private _timeoutId: number;

    constructor(ms: number) {
        super();

        this._timeoutId = <any>setTimeout(() => {
            super.resolve();
        }, ms);
    }

    resolve = () => {
        clearTimeout(this._timeoutId);
        super.resolve();
    };

    reject = (err?: any) => {
        clearTimeout(this._timeoutId);
        super.reject(err);
    };
}

class SleeperChanging {
    private _startTime: number;
    private _promise: PromiseManaged;
    private _updaterPromise: PromiseManagedTimeouted;
    
    constructor(private _duration: number) { }

    getDelay() {
        if (!this._promise) {
            return -1;
        }

        return Date.now() - this._startTime;
    }

    private async _handleUpdaterPromise() {
        if (!this._promise) {
            return;
        }

        if (this._updaterPromise) {
            return this._updaterPromise.resolve();
        }
        
        this._updaterPromise = new PromiseManagedTimeouted(this.getDelay());

        await this._updaterPromise.promise;

        this._updaterPromise = null;

        if (this.getDelay() >= this._duration) {
            this._promise?.resolve();
            this._promise = null;
            return;
        }

        this._handleUpdaterPromise();
    }

    get duration() { return this._duration; }
    set duration(v) {
        this._duration = v;

        if (this.getDelay() < this._duration) {
            return;
        }

        this._handleUpdaterPromise();
    }
    
    sleep() {
        if (this._promise) {
            throw new Error();
        }

        this._startTime = Date.now();
        this._promise = new PromiseManaged();
        this._handleUpdaterPromise();

        return this._promise.promise;
    }

    resolve() {
        this._updaterPromise?.resolve();
        this._promise?.resolve();
        this._promise = null;
    }
}

export class Helpers {
    static readonly sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    static readonly PromiseManaged = PromiseManaged;
    static readonly PromiseManagedTimeouted = PromiseManagedTimeouted;
    static readonly SleeperChanging = SleeperChanging;

    static rand(max: number, min = 0) {
        return min + Math.random() * (max - min);
    }

    static randInt(max: number, min = 0) {
        return Math.trunc(Helpers.rand(max, min));
    }
}

import { PromiseManagedTimeouted, PromiseManaged } from "./Promise";

export class SleeperChanging {
    private _startTime: number;
    private _promise: PromiseManaged;
    private _updaterPromise: PromiseManagedTimeouted;
    
    constructor(private _duration: number) { }

    get isActive() {
        return !!this._promise;
    }

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

    extend() {
        this._startTime = Date.now();
        this._handleUpdaterPromise();

        return this;
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

    getPromise() {
        return this._promise?.promise;
    }
}

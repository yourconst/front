export class PromiseManaged<T = void> {
    private readonly _resolve: T extends void ? () => void : (res: T) => void;
    private readonly _reject: (err?: any) => void;
    readonly promise: Promise<T>;
    private _isResolved = false;
    _isStarted = false;

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

export class PromiseManagedTimeouted extends PromiseManaged<void> {
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

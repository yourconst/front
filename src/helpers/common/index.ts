class PromiseManaged<T = void> {
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

interface NumberUnitFormatterUnit {
    name: string;
    value: number;
    countToNext?: number;
    decimals?: number;
}

export class NumberUnitFormatter {
    readonly units: NumberUnitFormatterUnit[];

    constructor(units: NumberUnitFormatterUnit[], options?: {
        countToNext?: number;
        baseToFormat?: number;
        decimals?: number;

    }) {
        if (!units.length) {
            throw new Error('Units is empty');
        }

        this.units = units.slice().sort((e1, e2) => e1.value - e2.value);

        for (const unit of this.units) {
            unit.countToNext ??= options?.countToNext ?? 1000;
            unit.decimals ??= options?.decimals;
        }
    }

    getInfo(value: number) {
        let rv = value;
        let ru: NumberUnitFormatterUnit;

        for (const unit of this.units) {
            rv = value / unit.value;

            if (Math.abs(rv) < unit.countToNext) {
                ru = unit;
                break;
            }
        }

        if (!ru) {
            ru = this.units.at(-1);
        }

        return {
            value: rv,
            unit: ru,
        };
    }

    format(value: number) {
        if (!isFinite(value)) {
            return `${value}`;
        }

        const info = this.getInfo(value);
        let strValue: string;

        if (typeof info.unit?.decimals === 'number') {
            strValue = info.value.toFixed(info.unit.decimals);
        } else {
            strValue = `${info.value}`;
        }

        return `${strValue}${info.unit.name}`;
    }
}

export class Helpers {
    static readonly sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    static readonly PromiseManaged = PromiseManaged;
    static readonly PromiseManagedTimeouted = PromiseManagedTimeouted;
    static readonly SleeperChanging = SleeperChanging;
    static readonly NumberUnitFormatter = NumberUnitFormatter;

    static randElement<T>(array: T[]) {
        return array[Helpers.randInt(0, array.length)];
    }

    static rand(max: number, min = 0) {
        return min + Math.random() * (max - min);
    }

    static randInt(max: number, min = 0) {
        return Math.trunc(Helpers.rand(max, min));
    }

    static isPow2(n: number) {
        return (n & (n - 1)) === 0;
    }

    static capitalizeFirstLetter(s: string) {
        return s.slice(0, 1).toUpperCase().concat(s.slice(1));
    }

    static createOffscreenCanvas(width: number, height: number) {
        if (window['OffscreenCanvas']) {
            return new OffscreenCanvas(width, height);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        return canvas;
    }

    static fract(n: number) {
        return n % 1;
    }

    static pnrandf(seed: number) {
        return (
            43758.5453 + (
                (seed % 123.456789) * 43758.5453
            ) % 1
        ) % 1;

        // return (
        //     (
        //         seed + 43758.5453 + seed * 43758.5453
        //     ) % 123.456789
        // ) % 1;
    }

    static pnrandi30(seed: number) {
        return (Helpers.pnrandf(seed) * (1 << 30)) >> 0;
    }

    static psrandf(s: string, seed = s.length) {
        for (let i = 0; i < s.length; ++i) {
            seed = Helpers.pnrandf(s.charCodeAt(i) + i * seed);
        }

        return seed;
    }

    static psrandi30(s: string, seed = s.length) {
        for (let i = 0; i < s.length; ++i) {
            seed = Helpers.pnrandi30(s.charCodeAt(i) + i * seed);
        }

        return seed;
    }

    static getbiti32(n: number, bitNumber: number) {
        return !!(n & (1 << bitNumber));
    }
}

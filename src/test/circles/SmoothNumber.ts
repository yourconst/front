export class SmoothNumber {
    private _source = 0;
    private _target = 0;

    private _startTime = Date.now();

    constructor(target = 0, public transition = 300) {
        this.set(target);
    }

    getPercent() {
        return Math.pow(Math.min(1, (Date.now() - this._startTime) / this.transition), /* 0. */1);
    }

    getTarget() {
        return this._target;
    }

    get() {
        return this._source + (this._target - this._source) * this.getPercent();
    }

    set(_v: number) {
        this._source = this.get();

        this._target = _v;
        this._startTime = Date.now();

        return this;
    }

    get value() {
        return this._target;
    }
    set value(v) {
        this.set(v);
    }

    setTransition(_t: number) {
        this._source = this.get();
        this._startTime = Date.now() - this.transition * (1 - this.getPercent());

        return this;
    }
}

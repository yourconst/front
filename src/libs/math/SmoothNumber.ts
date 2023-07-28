export class SmoothNumber {
    private _source = 0;
    private _target = 0;

    private _startTime = Date.now();

    constructor(target = 0, private _transition = 300) {
        this.setTarget(target);
    }

    getPercent() {
        return Math.pow(Math.min(1, (Date.now() - this._startTime) / this._transition), /* 0. */1);
    }

    get() {
        return this._source + (this._target - this._source) * this.getPercent();
    }

    get value() {
        return this.get();
    }

    setTarget(_v: number) {
        this._source = this.get();

        this._target = _v;
        this._startTime = Date.now();

        return this;
    }

    get target() {
        return this._target;
    }
    set target(v) {
        this.setTarget(v);
    }

    setTransition(_t: number) {
        if (_t === this._transition) {
            return this;
        }

        // this._source = this.get();
        // this._startTime = Date.now();
        this._transition = _t;

        return this;
    }

    get transition() {
        return this._transition;
    }
    set transition(v) {
        this.setTransition(v);
    }
}


class Range {
    constructor(start = 0, end = 1) {
        this.start = start;
        this.end = end;
    }

    set(r = new Range()) {
        this.start = r.start;
        this.end = r.end;

        return this;
    }

    setRange(start = 0, end = 1) {
        this.start = start;
        this.end = end;

        return this;
    }

    getNormalBy(range = new Range()) {
        var r = range.difference();

        return new Range((this.start - range.start) / r, 1 + (this.end - range.end) / r);
    }

    equals(r = new Range()) {
        return ((this.start == r.start) && (this.end == r.end));
    }

    include(num = 0) {
        return ((this.start <= num) && (num <= this.end));
    }

    difference() {
        return (this.end - this.start);
    }
}

class Animation {
    get transition() { return 0.001 * this.trnstn; }
    set transition(value) { this.trnstn = 1000 * value; }

    get animate() {
        var res = this.trnstn > Date.now() - this.startTime;

        if(!res)
            this.base.set(this.target);

        return res;
    }

    get gotResultState() {
        let res = this._gotResultState && !this.animate;

        if(!this.animate)
            this._gotResultState = true;

        return res;
    }

    begin(newTarget, callback = function(){}) {
        this.base.set(this.getCurrentState());
        this.target.set(newTarget);

        this.startTime = Date.now();

        this._gotResultState = false;

        return this;
    }

    getPercent() {
        var dt = Date.now() - this.startTime;
        return Math.max(0, Math.min(1, dt / this.trnstn));
    }

    getReversePercent() {
        return (1 - this.getPercent());
    }

    static linear(x) {
        return x;
    }

    static bezier(x) {
        let r = 1 / (Math.exp((x - 0.5) / -0.1) + 1);
        return (r - 0.0066928509242848554) * 1.0135673098126083; // for including at [0; 1]
    }

    getCurrentState(y = Animation.bezier) {
        var p = this.getPercent(),
            ct = y(p),
            b = this.base, t = this.target;
        
        return this.last.setRange(b.start - (b.start - t.start) * ct,
                        b.end - (b.end - t.end) * ct);
    }

    getReverseState() {
        var p = this.getPercent(),
        ct = this.y(p),
            b = this.base, t = this.target;
        
        return this.last.setRange(b.start - (b.start - t.start) * ct,
                        b.end - (b.end - t.end) * ct);
    }
    
    constructor(transition = 0.3, base = new Range(), target = new Range()) {
        this.trnstn;

        this._gotResultState = false;

        this.startTime = Date.now();
        this.transition = transition;

        this.last = new Range().set(base);

        this.base = new Range().set(base);
        this.target = new Range().set(target);

        this.callback = function(th) {};
    }
}
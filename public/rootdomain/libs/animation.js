const forBez = x => (1 / (Math.exp((x - 0.5) / -0.1) + 1));

const minBez = forBez(0), maxBez = forBez(1),
    rangeBez = maxBez - minBez, multBez = 1 / rangeBez;

const linearFunc = x => x,
    bezierFunc = x => (forBez(x) - minBez) * multBez;

class Animation {
    get transition() { return 0.001 * this._transition; }
    set transition(value) { this._transition = 1000 * value; }

    get animate() {
        var res = this._transition > Date.now() - this.startTime;

        if(!res)
            this.base = this.target;

        return res;
    }

    get gotResultState() {
        let res = this._gotResultState && !this.animate;

        if(!this.animate)
            this._gotResultState = true;

        return res;
    }

    begin(newTarget, base) {
        this.base = isNaN(base) ? this.getCurrentState() : base;
        this.target = newTarget;

        this.startTime = Date.now();

        this._gotResultState = false;

        return this;
    }

    getPercent() {
        let dt = Date.now() - this.startTime;

        return Math.max(0, Math.min(1, dt / this._transition));
    }

    getReversePercent() {
        return (1 - this.getPercent());
    }

    getCurrentState() {
        let p = this.getPercent(),
            ct = this.y(p),
            b = this.base, t = this.target;

        this.last = b - (b - t) * ct;
        
        return this.last;
    }

    getReverseState() {
        let p = this.getReversePercent(),
            ct = this.y(p),
            b = this.base, t = this.target;

        this.last = b - (b - t) * ct;
        
        return this.last;
    }
    
    constructor(transition = 0.3, type = "linear", base = 0, target = 0) {
        this._transition = 0;
        this.transition = transition;

        this._gotResultState = false;

        this.startTime = Date.now();

        this.y = type == "bezier" ? bezierFunc : linearFunc;

        this.last = base;

        this.base = base;
        this.target = target;
    }
};

if(typeof module != 'undefined') {
    module.exports = Animation;
}
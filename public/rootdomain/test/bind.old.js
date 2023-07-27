if(typeof globalThis == 'undefined') {
    globalThis = window;
}

function bezier(x) {
    return 1 / (Math.exp((x - 0.5) / -0.1) + 1);
}

var minBez = bezier(0), maxBez = bezier(1),
    rangeBez = maxBez - minBez, multBez = 1 / rangeBez;

class Animation {
    get transition() { return 0.001 * this.trnstn; }
    set transition(value) { this.trnstn = 1000 * value; }

    get animate() {
        var res = this.trnstn > Date.now() - this.startTime;

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

    begin(newTarget, base, callback = function(){}) {
        this.base = isNaN(base) ? this.getCurrentState() : base;
        this.target = newTarget;

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
        return (bezier(x) - minBez) * multBez;
    }

    getCurrentState(y = Animation.bezier) {
        var p = this.getPercent(),
            ct = y(p),
            b = this.base, t = this.target;

        this.last = b - (b - t) * ct;
        
        return this.last;
    }

    getReverseState(y = Animation.bezier) {
        var p = this.getReversePercent(),
            ct = y(p),
            b = this.base, t = this.target;

        this.last = b - (b - t) * ct;
        
        return this.last;
    }
    
    constructor(transition = 0.3, base = 0, target = 0) {
        this.trnstn;

        this._gotResultState = false;

        this.startTime = Date.now();
        this.transition = transition;

        this.last = base;

        this.base = base;
        this.target = target;

        this.callback = function(th) {};
    }
};

function spow(value, pow) {
    return Math.sign(value) * Math.pow(Math.abs(value), pow);
}

function fromNumber(val, min, max, pow) {
    const d = max - min;

    return min + d * spow((val - min) / d, pow);
}

function toNumber(val, min, max, pow) {
    const d = max - min;

    return min + d * spow((val - min) / d, 1 / pow);
}

globalThis.from = {
    pow: (v, e) => {
        return fromNumber(
            parseFloat(v), parseFloat(e.min) || 0, parseFloat(e.max) || 1, e.pow
        );
    }
};

globalThis.to = {
    pow: (v, e) => {
        return toNumber(
            parseFloat(v), parseFloat(e.min) || 0, parseFloat(e.max) || 1, e.pow
        );
    }
};

class Obj {
    get value() { return this.parentObject[this.objectName] }
    set value(value) { this.parentObject[this.objectName] = value }

    getObject(str = "") {
        if(!str)
            return;

        const objs = str.split('.'),
            len = objs.length - 1;
        
        if(objs.length) {
            for(let i=0; i<len; ++i)
                /* if(this.parentObject.hasOwnProperty(objs[i]))
                    this.parentObject = this.parentObject[objs[i]]; */
                try {
                    if(this.parentObject[objs[i]])
                        this.parentObject = this.parentObject[objs[i]];
                    else
                        this.error = true;
                } catch(e) {
                    this.error = true;
                }

            this.objectName = objs[len];

            this.object = this.parentObject[this.objectName];
        }
    }

    constructor(str) {
        this.parentObject = globalThis;
        this.objectName;
        this.object;
        this.error = false;

        this.getObject(str);
    }
};

TouchEvent.prototype.getPageX = function(num = 0) {
    return this.targetTouches[num].pageX;
};
TouchEvent.prototype.getPageY = function(num = 0) {
    return this.targetTouches[num].pageY;
};

const self = val => val;

class Single {
    destructor() {
        this.element.removeEventListener("input", this.oninput);

        delete this.element.pow;
        delete this.element.single;
        delete this.object;
    }

    set elemValue(value) {
        this.element.value = this.to(value, this.element);
    }

    get value() {
        let val = this.element.value;
        return this.from(
                this.element.type == "number" || this.element.type == "range" ?
                parseFloat(val) || 0 : val, this.element
            );
    }
    set value(value) {
        this.elemValue = value;

        if(this.object)
            this.object.value = value;

        this.handler(value);
    }

    set animateValue(value) {
        if(this.isAnimator) {
            //this.animation.base.end = this.lastValue;
            //this.animation.target.end = this.lastValue;
            this.animation.begin(value, this.lastValue);

            if(this.element.type == "number")
                this.elemValue = value;
        } else
            this.value = value;
    }

    animate() {
        if(this.object)
            this.lastValue = this.object.value;

        if(this.isAnimator && !this.animation.gotResultState) {
            let value = this.animation.getCurrentState();

            if(this.element.type == "number") {
                if(this.object)
                    this.object.value = value;
                this.handler(value);
            } else
                this.value = value;
        } else
            this.elemValue = this.lastValue;

        //this.lastValue = this.value;
    }

    gestures(e) {
        if(e.type == "number") {
            let d = false, h = e.clientHeight, v, y = 0, ppy = 0, py = 0, s,
                anim = false, last = 0,
                min = parseFloat(e.min) || 0,
                max = parseFloat(e.max) || 0,
                rng = Math.abs(max - min),
                step = e.step != "any" ? 1 : rng > 2 ? 1 : rng / 100;

            function an() {
                if(!d && Date.now() - s < 1e3) {
                    anim = true;
                    requestAnimationFrame(an);
                } else
                    anim = false;

                e.single.value = v + last * step * (Date.now() - s) / 1e3;
            }

            e.ontouchstart = function(event) {
                event.preventDefault();

                v = parseFloat(e.value);
                d = true;
                h = e.clientHeight;
                y = event.getPageY();

                document.ontouchmove = function(event) {
                    if(d) {
                        ppy = py;
                        py = event.getPageY();
                        e.single.value = v + step * (y - py) / h;
                    }
                };

                document.ontouchend = function(event) {
                    let dif = ppy - py;

                    d = false;
    
                    //alert([py - ppy, h]);
    
                    if(Math.abs(dif) / h > 0.5) {
                        v = parseFloat(e.value);
                        last += Math.pow(Math.sign(dif) + 2 * dif / h, 3);
                        s = Date.now();

                        if(!anim)
                            an();
                    }
    
                    document.ontouchmove = null;
                    document.ontouchend = null;
                };
            };
        }
    }

    init(e, second = false) {
        const objprop = e.getAttribute("object");

        this.gestures(e);
        
        this.from = new Obj(e.getAttribute("from")).object || self,
        this.to = new Obj(e.getAttribute("to")).object || self,
        this.handler = new Obj(e.getAttribute("change")).object || self;
        this.animation.transition = parseFloat(e.getAttribute("transition")) || 0;

        this.element = e;

        e.single = this;
        
        e.pow = parseFloat(e.getAttribute("pow")) || 0;

        if(objprop) {
            this.object = new Obj(objprop);
            
            if(this.object.error && !second) {
                setTimeout(()=>this.init(e, true), 0);
                return;
            }

            let value = this.object.value;

            if(this.isAnimator) {
                this.animation.begin(value);

                if(this.element.type == "number")
                    this.elemValue = value;
            } else
                this.value = value;
        }
    }

    get isAnimator() {
        return !!this.animation.transition;
    }

    constructor(element, handler) {
        this.element;
        this.object;
        this.handler; this.from; this.to;
        this.animation = new Animation(0);
        this.lastValue = 0;

        if(element.type == "checkbox" || element.type == "radio")
            Object.defineProperty(element, "value", {
                get: function() {return this.checked;},
                set: function(value) {this.checked = !!value;}
            });

        this.oninput = handler || (event => {
            const value = this.value;

            this.animateValue = value
        });

        element.addEventListener("input", this.oninput);

        this.init(element);
    }
};

class Group {
    destructor() {
        for(const s of this.singles)
            s.destructor();
    }

    set value(value) {
        for(const e of this.singles)
                e.elemValue = value;
        if(this.object)
            this.object.value = value;
        this.handler(value);
    }

    animate() {
        if(this.isAnimator && !this.animation.gotResultState)
            this.value = this.animation.getCurrentState();
    }

    add(e) {
        const s = new Single(e, this.oninput);

        this.handler = s.handler;

        if(s.animation.transition)
            this.animation.transition = s.animation.transition;

        if(!this.object)
            this.object = s.object;

        if(this.object) {
            let value = this.object.value;

            if(this.isAnimator) {
                this.animation.begin(value);
            } else
                this.value = value;
        }
        
        this.singles.push(s);
    }

    get isAnimator() { 
        return !!this.animation.transition;
    }

    constructor(element) {
        this.singles = new Array;
        this.object;
        this.handler;
        this.animation = new Animation(0);

        this.oninput = event => {
            const value = event.target.single.value;

            if(this.isAnimator)
                this.animation.begin(value);
            else
                this.value = value;
        };

        this.add(element);
    }
}

class Bind {
    destructor() {
        for(const s of this.singles)
            s.destructor();

        for(const g of this.groups.values())
            g.destructor();

        this.singles.length = 0;
        this.groups.clear();
    }
    
    getElements(container = document) {
        return Array.from(container.getElementsByClassName("bind"));
    }

    animate() {
        for(let s of this.singles)
            s.animate();

        for(let g of this.groups.values())
            g.animate();
    }

    parseElement(e) {
        const group = e.getAttribute("group");

        if(group) {
            this.groups.add(group, e);
        } else {
            this.singles.push(new Single(e));
        }
    }

    init(container = document) {
        const es = this.getElements(container);

        for(const e of es)
            this.parseElement(e);
    }

    constructor(container = document) {
        this.singles = new Array;
        this.groups = new Map;
        this.groups.add = function(group, e) {
            let g = this.get(group);

            if(g)
                g.add(e);
            else {
                g = new Group(e);
                this.set(group, g);
            }

            return g;
        };

        this.init(container);
    }
};

if(typeof module != 'undefined') {
    module.exports = Bind;
}
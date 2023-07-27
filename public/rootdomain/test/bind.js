/*
    bind.yc.js by @yourconst
    https://github.com/yourconst/bind.yc/

    2019
*/

const Bind = (function() {
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
            //if(this.target != newTarget || !isNaN(base)) {
                this.base = isNaN(base) ? this.getCurrentState() : base;
                this.target = newTarget;

                this.startTime = Date.now();

                this._gotResultState = false;
            //}

            return this;
        }

        getPercent() {
            let dt = Date.now() - this.startTime;

            return this._transition ? Math.max(0, Math.min(1, dt / this._transition)) : 1;
        }

        getReversePercent() {
            return (1 - this.getPercent());
        }

        getCurrentState() {
            let p = this.getPercent(),
                ct = this.y(p),
                b = this.base, t = this.target;

            this.last = b - (b - t) * ct;

            if(!isFinite(this.last))
                this.last = this.target;
            
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

    const
        spow = (value, pow) => Math.sign(value) * Math.pow(Math.abs(value), pow),
        fromNumber = (val, min, max, pow) => {
            const d = max - min;
            return min + d * spow((val - min) / d, pow);
        },
        toNumber = (val, min, max, pow) => {
            const d = max - min;
            return min + d * spow((val - min) / d, 1 / pow);
        },
        fromPow = (v, s) => fromNumber(parseFloat(v) || 0, s.min, s.max, s.pow),
        toPow = (v, s) => toNumber(parseFloat(v) || 0, s.min, s.max, s.pow),
        addValueProp = (element) => {
            Object.defineProperty(element, "value", {
                get: function() {return Number(this.checked);},
                set: function(value) {this.checked = !!value;}
            });
        };

    class Obj {
        get value() { return this.parentObject[this.objectName]; }
        set value(value) {
            if(!this.error)
                this.parentObject[this.objectName] = value;
        }

        getObject(str = "") {
            this.error = true;
            this.string = str;

            if(!str)
                return;

            const objs = str.split('.'),
                len = objs.length;

            objs.unshift("window");
            this.objectName = objs[len];

            objs.length -= 1;

            this.parentObject = eval(objs.join('.'));

            if(this.parentObject && typeof this.parentObject[this.objectName] != "undefined")
                this.object = this.parentObject[this.objectName];
            else
                return;

            this.error = false;
        }

        constructor(str) {
            this.string;
            
            this.parentObject = window;
            this.objectName;
            this.object;
            this.error;

            this.getObject(str);
        }
    };

    const self = val => val;

    class Single {
        destructor() {
            this.element.removeEventListener("input", this.oninput);

            delete this.element.pow;
            delete this.element.single;
            delete this.object;
        }

        get isAnimator() {
            return !!this.oAnimation.transition;
        }

        get eValue() { return this.from(this.element.value, this); }
        set eValue(value) { this.element.value = this.to(value, this); }
        
        get oValue() { return this.object.value; }
        set oValue(value) { this.object.value = value; }

        get value() { return this.oValue; }
        set value(value) {
            this.oValue = value;
            this.eValue = value;
        }

        set animateValue(value) {
            if(this.isAnimator) {
                this.eAnimation.begin(value);
                this.oAnimation.begin(value);
            } else {
                this.value = value;
                this.handler(value);
            }
        }
        
        get transition() { return this.oAnimation.transition; }
        set transition(value) {
            this.oAnimation.transition = value;
            this.eAnimation.transition = value;
        }

        animate() {
            if(this.isAnimator && !this.oAnimation.gotResultState) {
                let val = this.oAnimation.getCurrentState();
                this.eValue = this.element.type == "number" ? 
                    this.eAnimation.target : this.eAnimation.getCurrentState();
                this.oValue = val;
                this.handler(val);
            }/*  else {
                const objVal = this.oValue;
                
                this.eValue = objVal;
                this.animation.target = objVal;
            } */
        }

        animateByGroup() {
            //if(this.isAnimator && !this.animation.gotResultState)
                this.eValue = this.eAnimation.getCurrentState();
            //this.eValue = this.animation.getCurrentState();
        }

        init(e) {
            const objprop = e.getAttribute("object");
            
            this.eAnimation.transition = 
                this.oAnimation.transition = 
                    parseFloat(e.getAttribute("transition")) || 0;

            this.min = parseFloat(e.min) || 0;
            this.max = parseFloat(e.max) || 1;
            this.pow = parseFloat(e.getAttribute("pow")) || 0;
            
            this.from = new Obj(e.getAttribute("from")).object || this.pow ?
                fromPow : e.type == "range" || e.type == "number" ?
                    val => parseFloat(val) || 0 : self,
            this.to = new Obj(e.getAttribute("to")).object || this.pow ?
                toPow : e.type == "range" || e.type == "number" ?
                    val => parseFloat(val) || 0 : self,
            this.handler = new Obj(e.getAttribute("change")).object || self;

            this.element = e;
            e.single = this;

            //if(objprop) {
                this.object = new Obj(objprop);

                if(!this.object.error)
                    this.animateValue = this.object.object;
            //}
        }

        constructor(element, handler = null) {
            this.element;
            this.object;
            this.handler; this.from; this.to;

            this.pow; this.min; this.max;

            this.eAnimation = new Animation(0, "bezier");
            this.oAnimation = new Animation(0, "bezier");

            this.animation = this.eAnimation;

            if(element.type == "checkbox" || element.type == "radio")
                addValueProp(element);

            this.oninput = handler || (event => {
                const val = this.eValue;

                this.eAnimation.base = val;

                this.animateValue = val;
                if(!this.isAnimator)
                    this.handler(val);
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

        get isAnimator() {
            return !!this.animation.transition;
        }
        
        get oValue() { return this.object.value; }
        set oValue(value) { this.object.value = value; }

        set eValue(value) {
            for(const e of this.singles)
                    e.eValue = value;
        }

        get value() { return this.oValue; }
        set value(value) { this.eValue = this.oValue = value; }

        set animateValue(value) {
            //if(this.isAnimator) {
                this.animation.begin(value);

                for(const s of this.singles)
                    s.eAnimation.begin(value);
            /* } else {
                this.value = value;
            } */
        }

        animate() {
            if(/* this.isAnimator && */ !this.animation.gotResultState) {
                let val = this.animation.getCurrentState();
                
                this.oValue = val;
                this.handler(val);
            }

            for(const e of this.singles)
                e.animateByGroup();
        }

        add(e) {
            const s = new Single(e, this.oninput);

            if(
                !this.isAnimator && s.isAnimator ||
                this.animation.transition < s.oAnimation.transition
            )
                this.animation.transition = s.oAnimation.transition;

            if(this.handler == self)
                this.handler = s.handler;
            
            this.singles.push(s);

            if(this.object) {
                s.eAnimation.begin(this.object.object);
            } else if(s.object) {
                this.object = s.object;
                this.animateValue = this.object.object;
            }
        }

        constructor(element) {
            this.singles = new Array;
            this.object;
            this.handler = self;

            this.actived;

            this.animation = new Animation(0, "bezier");

            this.oninput = event => {
                this.actived = event.target.single;

                const val = this.actived.eValue;

                this.actived.animation.base = val;

                if(this.actived.element.type == "number")
                    this.actived.animation.target = val;

                this.animateValue = val;

                if(!this.isAnimator)
                    this.handler(val);
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
        }

        animate() {
            this.onAnimate();

            for(const s of this.singles)
                s.animate();

            for(const g of this.groups.values())
                g.animate();
        }

        addToSingle(e) {
            const s = new Single(e);

            this.singles.push(s);

            if(s.object && !s.object.error)
                this.singlesObj.set(s.object.string, s);

            return s;
        };

        addToGroup(group, e) {
            let g = this.groups.get(group);

            if(g)
                g.add(e);
            else {
                g = new Group(e);
                this.groups.set(group, g);
            }

            return g;
        };
        
        getElements(container = document) {
            return Array.from(container.getElementsByClassName("bind"));
        }

        parseElement(e) {
            const group = e.getAttribute("group");

            if(group)
                this.addToGroup(group, e);
            else
                this.addToSingle(e);
        }

        init(container = document) {
            const es = this.getElements(container);

            for(const e of es)
                this.parseElement(e);
        }

        static get Animation() { return Animation; }

        get autoAnimate() { return this._autoAnimate; }
        set autoAnimate(value) {
            if(this._autoAnimate == false) {
                this._autoAnimate = !!value;

                const a = () => {
                    if(this._autoAnimate)
                        requestAnimationFrame(a);
                        //setTimeout(a, 16);
                    this.animate();
                }
        
                a();
            }

            this._autoAnimate = !!value;
        }

        constructor(container = document, autoAnimate = false) {
            this.singles = new Array;
            this.singlesObj = new Map;
            this.groups = new Map;

            this.init(container);
            
            this.onAnimate = e => {};

            this._autoAnimate;
            this.autoAnimate = autoAnimate;
        }
    };

    return Bind;
})();

if(typeof module != 'undefined') {
    module.exports = Bind;
}
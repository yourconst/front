(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

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

globalThis.fromNumber = fromNumber;
globalThis.toNumber = toNumber;

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

if(window.Touch) {
    TouchEvent.prototype.getPageX = function(num = 0) {
        return this.targetTouches[num].pageX;
    };
    TouchEvent.prototype.getPageY = function(num = 0) {
        return this.targetTouches[num].pageY;
    };
}

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
                this.numberOrRange ?
                parseFloat(val) || 0 : val, this.element
            );
    }
    set value(value) {
        this.elemValue = value;

        if(this.object)
            this.object.value = value;

        this.handler(value);
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
        const objprop = e.getAttribute("object"),
            pow = parseFloat(e.getAttribute("pow")) || 0;

        //this.gestures(e);
        
        e.pow = pow;
        
        this.from = new Obj(e.getAttribute("from")).object || pow ? from.pow : self,
        this.to = new Obj(e.getAttribute("to")).object || pow ? to.pow : self,
        this.handler = new Obj(e.getAttribute("change")).object || self;
        this.animation.transition = parseFloat(e.getAttribute("transition")) || 0;

        this.element = e;

        e.single = this;

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

    set animateValue(value) {
        if(this.isAnimator) {
            //this.animation.base.end = this.lastValue;
            //this.animation.target.end = this.lastValue;
            this.animation.begin(value, this.lastValue);

            if(this.numberOrRange)
                this.elemValue = value;
        } else
            this.value = value;
    }

    animate() {
        this.lastValue = this.object.value;

        if(this.isAnimator && !this.animation.gotResultState) {
            let value = this.animation.getCurrentState();

            if(this.numberOrRange) {
                if(this.object)
                    this.object.value = value;
                this.handler(value);
            } else
                this.value = value;
        } else
            this.elemValue = this.lastValue;

        //this.lastValue = this.value;
    }

    constructor(element, handler) {
        this.element;
        this.object;
        this.handler; this.from; this.to;
        this.animation = new Animation(0);
        this.lastValue = 0;
        this.numberOrRange = element.type == "number" || element.type == "range";

        if(element.type == "checkbox" || element.type == "radio")
            Object.defineProperty(element, "value", {
                enumerable: false,
                get: function() {return this.checked;},
                set: function(value) {this.checked = !!value;}
            });

        this.oninput = handler || (event => {
            console.log(event, this);
            const value = this.value;

            this.animateValue = value;
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
            if(e != this.changed)
                e.elemValue = value;
        if(this.object)
            this.object.value = value;
        this.handler(value);
    }

    set animateValue(value) {
        if(this.isAnimator) {
            this.changed = null;
            this.animation.begin(value);
        } else
            this.value = value;
    }

    animate() {
        if(this.isAnimator && !this.animation.gotResultState)
            this.value = this.animation.getCurrentState();
    }

    add(e) {
        const s = new Single(e, this.oninput);

        if(this.handler == self)
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
        this.handler = self;
        this.changed = {};
        this.animation = new Animation(0);

        this.oninput = event => {
            const value = event.target.single.value;

            //alert(value);

            if(this.isAnimator) {
                this.changed = event.target.single;
                this.animation.begin(value);
            } else
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

globalThis.Bind = Bind;

if(typeof module != 'undefined') {
    module.exports = Bind;
}
},{}],2:[function(require,module,exports){
(function (global){
const Point = require("./simplePoint");

class Simple {
    setProperties(x = 0, y = 0, radius = 0, angle = 0) {
        this.position.setCoordinates(x, y);
        this.radius = radius;
        this.angle = angle;

        return this;
    }
    
    constructor(x = 0, y = 0, radius = 0, angle = 0) {
        this.position = new Point(x, y);
        this.radius = radius;
        this.angle = angle;
    }
}

class Drawer {
    isOnScreen(x,y,r) {
        return (((x + r >= 0) && (x - r <= this.width)) 
                && ((y + r >= 0) && (y - r <= this.height)));
    }

    getColor(p,r1,g1,b1,r2,g2,b2) {
        r1 += Math.trunc(p * (r2 - r1));
        g1 += Math.trunc(p * (g2 - g1));
        b1 += Math.trunc(p * (b2 - b1));

        return `${r1},${g1},${b1}`;
    }

    drawClientCircle(x, y, r, color = "rgba(0,0,0,0.1)", scolor = "") {
        let ctx = this.ctx,
            k = this.canvas.width / this.canvas.clientWidth;

        x *= k; y *= k; r *= k;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, this.pi2);
        ctx.fill();
    }

    drawExplosion(_x, _y, r, rm) {//}, color = "rgb(255,165,0)") {
        let ctx = this.ctx,
            x = this.hWidth + (_x - this.observer.position.x + this.offset.x) * this._c,
            y = this.hHeight + (_y - this.observer.position.y + this.offset.y) * this._c,
            grd,
            p = r / rm, pp = Math.pow(p, 9);

        r *= 2 * this._c;

        if(this.isOnScreen(x,y,r)) {
            grd = ctx.createRadialGradient(x, y, 0, x, y, r);
            grd.addColorStop(0, `rgba(${this.getColor(p.p2(),255,255,255,255,165,0)},1)`);
            grd.addColorStop(0.3, `rgba(${this.getColor(p,255,165,0,255,0,0)},0.97)`);
            grd.addColorStop(0.5, `rgba(${this.getColor(p,255,165,0,99,99,99)},0)`);
            grd.addColorStop(0.5 + 0.35 * pp, `rgba(255,255,255,0)`);
            grd.addColorStop(0.5 + 0.45 * pp, `rgba(${this.getColor(p,230,230,230,180,180,180)},0.5)`);
            grd.addColorStop(0.5 + 0.5 * pp, `rgba(255,255,255,0)`);

            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, this.pi2);
            ctx.fill();
        }
    }

    drawExplosionBack(_x, _y, r, rm) {//}, color = "rgb(255,165,0)") {
        let ctx = this.ctx,
            x = this.hWidth + (_x - this.observer.position.x + this.offset.x) * this._c,
            y = this.hHeight + (_y - this.observer.position.y + this.offset.y) * this._c,
            grd,
            p = 1 - r / rm;

        r *= this._c;

        if(this.isOnScreen(x,y,r)) {

            grd = ctx.createRadialGradient(x, y, 0, x, y, r);
            grd.addColorStop(0, `rgba(${this.getColor(p,255,165,0,99,99,99)},1)`);
            grd.addColorStop(0.3, `rgba(${this.getColor(p,255,0,0,55,55,55)},0.97)`);
            grd.addColorStop(0.5, `rgba(${this.getColor(p,99,99,99,11,11,11)},0)`);
            grd.addColorStop(0.85, `rgba(255,255,255,0)`);
            grd.addColorStop(0.95, `rgba(${this.getColor(p,180,180,180,230,230,230)},0.5)`);
            grd.addColorStop(1, `rgba(255,255,255,0)`);

            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, this.pi2);
            ctx.fill();
        }
    }

    drawGift(_x, _y, r) {//}, color = "rgb(255,165,0)") {
        let ctx = this.ctx,
            x = this.hWidth + (_x - this.observer.position.x + this.offset.x) * this._c,
            y = this.hHeight + (_y - this.observer.position.y + this.offset.y) * this._c,
            grd;

        r *= this._c;

        if(this.isOnScreen(x,y,r)) {

            grd = ctx.createRadialGradient(x, y, 0, x, y, r);
            grd.addColorStop(0.2, `rgba(55,255,255,1)`);
            grd.addColorStop(0.5, `rgba(255,55,55,1)`);
            grd.addColorStop(0.8, `rgba(55,255,55,1)`);
            grd.addColorStop(1, `rgba(99,99,99,0)`);

            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, this.pi2);
            ctx.fill();
        }
    }

    drawCircle(_x, _y, r, color = "#cccccc") {
        let ctx = this.ctx,
            x = this.hWidth + (_x - this.observer.position.x + this.offset.x) * this._c,
            y = this.hHeight + (_y - this.observer.position.y + this.offset.y) * this._c;

        r *= this._c;

        if(this.isOnScreen(x,y,r)) {

            ctx.fillStyle = color;

            ctx.beginPath();
            //ctx.arc(x, y, r, angle + this.hrad, angle + this.hrad + this.rad);
            ctx.arc(x, y, r, 0, this.pi2);
            ctx.fill();
        }
    }

    drawComplexCircle(_x, _y, r, angle = 0, color = "#88dd88", scolor = "#888888") {
        let ctx = this.ctx,
            x = this.hWidth + (_x - this.observer.position.x + this.offset.x) * this._c,
            y = this.hHeight + (_y - this.observer.position.y + this.offset.y) * this._c;

        r *= this._c;

        if(this.isOnScreen(x,y,r)) {

            ctx.fillStyle = color;
            ctx.strokeStyle = scolor;

            ctx.beginPath();
            //ctx.arc(x, y, r, angle + this.hrad, angle + this.hrad + this.rad);
            ctx.arc(x, y, r, angle, angle + this.pi2);
            ctx.fill();
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }

    drawStatic(b) {
        this.drawCircle(b.position.x, b.position.y, b.radius);
    }

    draw(b, color = "#808080", scolor = "#888888") {
        this.drawComplexCircle(b.position.x, b.position.y, b.radius, b.angle, color, scolor);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    setObserver(observer = new Simple()) {
        this.observer = observer;
    }

    setCanvas(canvas = document.createElement("canvas")) {
        this.canvas = canvas;

        canvas.style.width = "100%";
        canvas.style.height = "100%";
        //canvas.style.imageRendering = "pixelated";

        this.ctx = canvas.getContext("2d");

        this.width = this.width;
        this.height = this.height;
    }

    get width() {return this.canvas.width;}
    set width(value) {
        this.canvas.width = (value * this._resolution) >> 0;
        this.hWidth = this.canvas.width >> 1;
    }

    get height() {return this.canvas.height;}
    set height(value) {
        this.canvas.height = (value * this._resolution) >> 0;
        this.hHeight = this.canvas.height >> 1;
    }

    get sceneHW(){return this.hWidth / (this._scale * this._resolution);}
    get sceneHH(){return this.hHeight / (this._scale * this._resolution);}

    get scale(){return this._scale;}
    set scale(value) {
        this._scale = value;
        this._c = value * this._resolution;

        localStorage.setItem("scale", value);
    }

    get resolution(){return this._resolution;}
    set resolution(value) {
        this._resolution = value;

        this.width = this.canvas.parentElement.clientWidth;
        this.height = this.canvas.parentElement.clientHeight;

        this._c = this._scale * value;

        localStorage.setItem("resolution", value);
    }

    constructor(observer, canvas) {
        this.setCanvas(canvas); 
        this.setObserver(observer);

        this._scale = 1;
        this._resolution = 1;
        this._c = 1;
        this.offset = {x: 0, y: 0};

        this.pi2 = Math.PI * 2;
        this.rad = this.pi2 * 0.8;
        this.hrad = this.pi2 * 0.1;

        window.onresize = (event) => {
            ++window.onresize.callsCount;

            setTimeout(() => {
                if(!(--window.onresize.callsCount)) {
                    this.resolution = this.resolution;
                }
            }, 300);
        };

        window.onresize.callsCount = 0;
    }
};

global.Simple  = Simple;
module.exports = global.Drawer = Drawer;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./simplePoint":5}],3:[function(require,module,exports){
(function (global){
const Point = require("./simplePoint"),
    Pages = require("./pages"),
    MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
            .test(navigator.userAgent);

if(window.Touch) {
    Touch.prototype.getPageX = function() {
        return this.pageX;
    };
    Touch.prototype.getPageY = function() {
        return this.pageY;
    };

    Touch.prototype.getOffset = function() {
        const rect = this.target.getBoundingClientRect();

        return new Point(this.pageX - rect.left,
                        this.pageY - rect.top);
    };

    Touch.prototype.getCentredOffset = function() {
        const rect = this.target.getBoundingClientRect();

        return new Point(
            this.pageX - rect.left - 0.5 * this.target.clientWidth,
            this.pageY - rect.top - 0.5 * this.target.clientHeight
        );
    };

    TouchEvent.prototype.getPageX = function(num = 0) {
        return this.targetTouches[num].pageX;
    };
    TouchEvent.prototype.getPageY = function(num = 0) {
        return this.targetTouches[num].pageY;
    };

    TouchEvent.prototype.getOffset = function(num = 0) {
        const rect = this.target.getBoundingClientRect(),
            tc = this.targetTouches[num];

        return new Point(tc.pageX - rect.left, tc.pageY - rect.top);
    };

    TouchEvent.prototype.getCentredOffset = function(num = 0) {
        const rect = this.target.getBoundingClientRect(),
            t = this.targetTouches[num];

        return new Point(
            t.pageX - rect.left - 0.5 * t.target.clientWidth,
            t.pageY - rect.top - 0.5 * t.target.clientHeight
        );
    };
}

MouseEvent.prototype.getOffset = function() {
    return new Point(this.offsetX, this.offsetY);
};

MouseEvent.prototype.getCentredOffset = function() {
    return new Point(this.offsetX - 0.5 * this.target.clientWidth,
                    this.offsetY - 0.5 * this.target.clientHeight);
};

Object.defineProperty(HTMLElement.prototype, "visible", {
    enumerable: false,
    get: function() { return this.style.display != "none" },
    set: function(value) {
        this.style.display = value ? "block" : "none";
    }
});

class TouchType {
    constructor(touch, type = "unknown") {
        this.type = type;
        this.touch = touch;
        this.date = Date.now();
    }
};

class GUI {
    setKey(name, code) {
        let lc = this.keys.codes[name];

        if(lc) {
            delete this.keys.names[lc];
        }

        this.keys.codes[name] = code;
        this.keys.names[code] = name;
        this.keys.pressed[name] = false;
    }

    setKeys(obj) {
        for(let name in obj)
            this.setKey(name, obj[name]);
    }

    get play(){return this._play;}
    set play(value) {
        if(!this._play) {
            this._play = true;
            this.onresume();
        } else {
            this._play = false;
        }

        this.menuElem.visible = !this._play;
        this.menuButton.set(!this._play);
    }

    onkeydown(event) {
        let name = this.keys.names[event.code];

        if(name) {
            this.keys.pressed[name] = true;

            if(name == "menu")
                this.play = !this.play;
        }
    }

    onkeyup(event) {
        let name = this.keys.names[event.code];

        if(name) {
            this.keys.pressed[name] = false;
        }
    }

    ontouchstart(event) {
/*         const w = this.mouseElem.clientWidth, h = this.mouseElem.clientHeight,
            cp = new Point(w - 70, h - 70),
            r = 2 * 25; */
        let id;
        
        event.preventDefault();

        //alert(JSON.stringify(event.changedTouches[0]));

        for(let i=0, tc; i < event.changedTouches.length; ++i) {
            tc = event.changedTouches[i];
            id = tc.identifier;

            if(event.changedTouches[i].getOffset().subtract(this.joyCenter).mod > this.joyRadius) {
                if(this.keys.pressed.forward) {
                    this.keys.pressed.fire = true;
                    this.touches.set(id, new TouchType(tc, "fire"));
                } else {
                    let tt = new TouchType(tc);
                    this.touches.set(id, tt);
                    this.ukTouches.set(id, tt);

                    setTimeout(()=>this.ontouchmove(event), 23);
                }
            } else {
                this.keys.pressed.forward = true;
                this.touches.set(id, new TouchType(tc, "forward"));
            }

            this.ontouchmove(event);
        }
    }

    ontouchmove(event) {
        event.preventDefault();

        for(let i=0, id, tt; i < event.changedTouches.length; ++i) {
            id = event.changedTouches[i].identifier;
            tt = this.touches.get(id);

            if(tt.type == "unknown") {
                //alert(event.targetTouches.length);

                if(Date.now() - tt.date > 22) {
                    if(this.ukTouches.size == 1) {
                        this.keys.pressed.fire = true;
                        tt.type = "fire";
                        this.angle = event.getCentredOffset().angle;
                        this.ukTouches.delete(id);
                    }
                } else {
                    if(this.ukTouches.size > 1) {
                        for(let t of Array.from(this.ukTouches.values()))
                            t.type = "waiting";
                        //alert(this.ukTouches.size);
                    }
                }
            } else if(tt.type == "forward") {
                const /* w = this.mouseElem.clientWidth, h = this.mouseElem.clientHeight, */
                    coffset = event.getOffset().subtract(this.joyCenter),
                    r = this.joyRadius / 2, //25,
                    dr = 1 * r;

                this.angle = coffset.angle;
                this.intensity = Math.min(1, Math.max(0, (coffset.mod - dr) / r));

                this.mouse.centerPos.set(coffset);
            } else if(!this.keys.pressed.forward) {
                this.angle = event.changedTouches[i].getCentredOffset().angle;
            }
        }
    }

    ontouchend(event) {
        for(let i=0, id, tt; i < event.changedTouches.length; ++i) {
            id = event.changedTouches[i].identifier;
            tt = this.touches.get(id);

            if(!tt)
                continue;

            if(tt.type) {
                this.keys.pressed[tt.type] = false;
                this.touches.delete(id);
            }

            if(tt.type == "waiting") {
                this.ukTouches.delete(id);
                let tt = Array.from(this.ukTouches.values())[0];
                this.joyCenter.set(tt.touch.getOffset());
                this.onJoyPositionChange();
                tt.type = "forward";
                this.keys.pressed.forward = true;

                for(let d of Array.from(this.ukTouches.keys()))
                    if(d != tt.touch.identifier)
                        this.touches.delete(d);

                //alert([this.joyCenter.x, this.joyCenter.y]);
            }

            this.ukTouches.clear();
        }
    }

    onmousedown(event) {
        event.preventDefault();

        if(event.which == 1)
            this.keys.pressed.fire = this.mouse.left = true;
        
        if(event.which == 3)
            this.keys.pressed.forward = this.mouse.right = true;
    }

    onmousemove(event) {
        event.preventDefault();

        const 
            r = 0.125 * Math.min(this.mouseElem.clientWidth, this.mouseElem.clientHeight),
            dr = 0.1 * r,
            coffset = event.getCentredOffset();

        this.angle = coffset.angle;
        this.intensity = Math.min(1, Math.max(0, (coffset.mod - dr) / r));
            //hw = this.mouseElem.clientWidth / 2, hh = this.mouseElem.clientHeight / 2;

        //this.mouse.position.set(offset);
        this.mouse.centerPos.set(coffset);
    }

    onmouseup(event) {
        event.preventDefault();

        if(event.which == 1)
            this.keys.pressed.fire = this.mouse.left = false;
        
        if(event.which == 3)
            this.keys.pressed.forward = this.mouse.right = false;
    }

    setKeyElement(element = document) {
        if(this.keyElem) {
            this.keyElem.onkeydown =
            this.keyElem.onkeyup = null;
        }

        this.keyElem = element;

        this.keyElem.onkeydown = this.onkeydown.bind(this);
        this.keyElem.onkeyup = this.onkeyup.bind(this);
    }

    setMouseElement(element = document) {
        if(this.mouseElem) {
            this.mouseElem.onmousedown =
            this.mouseElem.onmousemove =
            this.mouseElem.onmouseup =
            this.mouseElem.ontouchstart =
            this.mouseElem.ontouchmove =
            this.mouseElem.ontouchend = null;

            this.mouseElem.oncontextmenu = event=>event.preventDefault();
        }

        this.mouseElem = element;

        if(MOBILE) {
            this.mouseElem.ontouchstart = this.ontouchstart.bind(this);
            this.mouseElem.ontouchmove = this.ontouchmove.bind(this);
            this.mouseElem.ontouchend = this.ontouchend.bind(this);
        } else {
            this.mouseElem.onmousedown = this.onmousedown.bind(this);
            this.mouseElem.onmousemove = this.onmousemove.bind(this);
            this.mouseElem.onmouseup = this.onmouseup.bind(this);
        }
    }

    setElement(element = document) {
        this.setKeyElement(element);
        this.setMouseElement(element);
    }

    setMenuElement(element) {
        if(element) {
            this.menuElem = element;

            if(this.pages)
                this.pages.destructor();

            this.pages = new Pages(document/* element */);

            this.menuElem.visible = !this.play;
        }
    }

    setMenuButton(element) {
        this.menuButton = element
            || this.keyElem.getElementsByTagName("menubtn")[0]
            || document.getElementById("menuButton");

        this.menuButton.set = function(enable) {
            if(enable)
                this.classList.add("enable");
            else
                this.classList.remove("enable");
        };

        this.menuButton.addEventListener("touchstart", event => {
            event.preventDefault();
            this.play = !this.play;
        });

        this.menuButton.addEventListener("click", event => {
            event.preventDefault();
            this.play = !this.play;
        });
    }

    constructor(onresume = ()=>{}, menuElem,
            mouseElem = document, keyElem = document) {
        this._play = true;
        this.onresume = onresume;

        this.touches = new Map;
        this.ukTouches = new Map;

        this.keys = {
            names: {},
            codes: {},
            pressed: {}
        };

        this.mouse = {
            left: false,
            right: false,
            position: new Point,
            centerPos: new Point
        };

        this.angle = 0;
        this.intensity = 0;

        this.setKeys({forward: "KeyW", backward: "KeyS", q: "KeyQ",
            fire: "Space", menu: "Escape"});

        this.setMouseElement(mouseElem);
        this.setKeyElement(keyElem);
        this.setMenuElement(menuElem);

        this.joyCenter = new Point(mouseElem.clientWidth-70, mouseElem.clientHeight-70);
        this.joyRadius = 70;

        this.onJoyPositionChange = () => {};

        this.setMenuButton();
    }
};

global.MOBILE = MOBILE;
module.exports = global.GUI = GUI;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./pages":4,"./simplePoint":5}],4:[function(require,module,exports){
const MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
            .test(navigator.userAgent);

Object.defineProperty(HTMLElement.prototype, "pageName", {
    get: function() {
        return this.getAttribute("pageName");
    },
    set: function(value) {
        this.setAttribute("pageName", value);
    }
});

Object.defineProperty(HTMLElement.prototype, "pagePosition", {
    get: function() {
        let t = this.style.transform,
            n = parseFloat(t.substring(t.indexOf('(') + 1)), 
            res = 0;

        if(n)
            res = n / 100;
    
        return res;
    },
    set: function(value) {
        setTimeout(()=>
            this.style.transform = `translateX(${100 * value}%)`
            , 10
        );
    }
});

class Pages {
    getByClass(className) {
        return Array.from(this.container.getElementsByClassName(className));
    }
    getPages() {
        return this.getByClass("page");
    }
    getLinks() {
        return this.getByClass("pageLink");
    }

    destructor() {
        const links = this.getLinks();

        for(const l of links)
            l.removeEventListener("click", this.onLinkClick);
            
        for(const p of Array.from(this.pages.values()))
            if(p.backLink)
                p.backLink.removeEventListener("click", this.onLinkClick);

        this.pages.clear();
    }

    setPageStyle(p) {
        p.style.position = "absolute";//"fixed";
        p.style.left = "0%";
        p.style.top = "0%";
        p.style.margin = "0";
        p.style.padding = "0";
        p.style.width = "100%";
        p.style.height = "100%";
        p.style.transition = "0.6s";
        p.transitionTimingFunction = "easy";

        p.pagePosition = 1;
    }

    goPage(name, isItBack) {
        let pg = this.pages.get(name),
            c = this.current;

        if(pg) {
            if(c) {
                c.pagePosition = -pg.pagePosition;

                if(pg.backLink && !isItBack)
                    pg.backLink.pageName = c.pageName;
            }

            pg.pagePosition = 0;
            this.current = pg;
        }
    }

    initBack(page) {
        let backs = page.getElementsByClassName("backLink"),
            b = null;

        if(backs.length) {
            b = backs[0];
            b.addEventListener("click", this.onLinkClick);
        }
        
        page.backLink = b;
    }

    checkDevice() {
        const arr = this.getByClass(MOBILE ? "desktopOnly" : "mobileOnly");

        for(const e of arr)
            e.style.display = "none";
    }

    init(container = document) {
        this.container = container;

        this.checkDevice();

        const pages = this.getPages(),
            links = this.getLinks();

        for(const p of pages) {
            this.setPageStyle(p);
            this.initBack(p);
            this.pages.set(p.pageName, p);
        }

        for(const l of links)
            l.addEventListener("click", this.onLinkClick);

        this.goPage("main");
    }

    constructor(container = document) {
        this.current = null;
        this.pages = new Map;

        this.onLinkClick =
            event => this.goPage(event.target.pageName, event.target.className == "backLink");

        this.init(container);
    }
};

if(typeof module != 'undefined') {
    module.exports = Pages;
}
},{}],5:[function(require,module,exports){
(function (global){
require("../prototypes");

class Point {
    /*
    x; y; _angle;
    */

    quarter(p) {
        let res = 0;

        if(p.x != this.x || p.y != this.y)
            if (p.x >= this.x && p.y >= this.y)
                res = 1;
            else if (p.x <= this.x && p.y >= this.y)
                res = 2;
            else if (p.x <= this.x && p.y <= this.y)
                res = 3;
            else if (p.x >= this.x && p.y <= this.y)
                res = 4;

        return res;
    }

    copy() {
        return new Point(this.x,this.y,this._angle);
    }

    subtract(p) {
        this.x -= p.x;
        this.y -= p.y;

        return this;
    }

    subtractNew(p) {
        return this.copy().subtract(p);
    }

    distance(p) {
        return ((this.x - p.x).p2() + (this.y - p.y).p2()).sqrt();
    }

    calcAngle() {
        return (this._angle = Math.atan2(this.y, this.x));
    }

    get mod() {
        return (this.x.p2() + this.y.p2()).sqrt();
    }

    get angle() { return this.calcAngle(); }

    set(p) {
        this.x = p.x;
        this.y = p.y;
        this._angle = p._angle;
    }

    setCoordinates(x = 0, y = 0, a = 0) {
        this.x = x;
        this.y = y;
        this._angle = a;
    }

    constructor(x = 1, y = 0, angle = 0) {
        this.x = x;
        this.y = y;

        this._angle = angle;
    }
};

module.exports = global.Point = Point;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../prototypes":9}],6:[function(require,module,exports){
(function (global){
class WS {
    send(obj) {
        this.socket.send(JSON.stringify(obj));
    }

    sendData(data) {
        this.socket.send(data);
    }

    reinit() {
        this.socket.onclose = null;
        this.socket.close();
        delete this.socket;
        this.init();
    }

    init() {
        this.socket = new WebSocket(this.address);
        this.socket.binaryType = "arraybuffer";
        //this.socket.parent = this;

        this.socket.onopen = message => {
            this.onopen(message);
        };

        this.socket.onmessage = message => {
            this.ondata(message.data);

            if(this.onmessage)
                this.onmessage(JSON.parse(message.data), message);
        };

        this.socket.onerror = message => {
            this.onerror(message);
        };

        this.socket.onclose = message => {
            this.onclose(message);
            setTimeout(() => this.reinit(), this.timeout);
        };
    }
    
    constructor(port = 1337, address = window.location.hostname, wss = false) {
        let str = (wss ? "wss" : "ws") + "://" + address + ":" + port;

        this.timeout = 1000;
        this.address = str;
        this.socket;
        
        this.onmessage = null;

        this.onopen =
            this.ondata =
            this.onerror =
            this.onclose = function () { };

        this.init();
    }
};

module.exports = global.WS = WS;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
(function (global){
const C = (2 << 14) / Math.PI, C_1 = Math.PI / (2 << 14);

Object.defineProperties(ArrayBuffer.prototype, {
    Int64Array: {
        get: function(){return new BigInt64Array(this); }
    },
    Int32Array: {
        get: function(){return new Int32Array(this); }
    },
    Int16Array: {
        get: function(){return new Int16Array(this); }
    },
    Int8Array: {
        get: function(){return new Int8Array(this); }
    },
    Uint64Array: {
        get: function(){return new BigUint64Array(this); }
    },
    Uint32Array: {
        get: function(){return new Uint32Array(this); }
    },
    Uint16Array: {
        get: function(){return new Uint16Array(this); }
    },
    Uint8Array: {
        get: function(){return new Uint8Array(this); }
    },
    Float32Array: {
        get: function(){return new Float32Array(this); }
    }
});

ArrayBuffer.prototype.toString = function(encoding = "utf-8") {
    return new TextDecoder(encoding).decode(this);
};

ArrayBuffer.prototype.toString2 = function() {
    const i8a = new Uint8Array(this);
    let res = "";
 
    for(let i=0; i<i8a.length; ++i)
        res += String.fromCharCode(i8a[i]);
 
    return res;
 };

 String.prototype.toBuffer = function(encoding = "utf-8") {
     return new TextEncoder(encoding).encode(this).buffer;
 };

 String.prototype.toBuffer2 = function() {
     const i8a = new Uint8Array(this.length);
     
     for(let i=0; i<this.length; ++i)
         i8a[i] = this.charCodeAt(i);
 
     return i8a.buffer;
 };

String.prototype.toBuffer3 = function() {
    let i = -1;
    const i8a = new Uint8Array(this.length);

    this.split('').map(function(c) {
        i8a[++i] = c.charCodeAt();
    });

    return i8a.buffer;
};



Boolean.prototype.makeBit = function(num) {
    return this << num;
};

Number.prototype.getBit = function(num) {
    return !!(this.valueOf() & (1 << num));
};

module.exports = global.DATA = {C, C_1};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){
(function (global){
const DATA = require("./data"),
    WS = require("./client/ws"),
    Drawer = require("./client/drawer"),
    GUI = require("./client/gui"),
    Time = require("./time"),
    Bind = require("./client/bind");

const ws = new WS(2002),
    drawer = new Drawer,
    gui = new GUI(draw, document.getElementById("menuContainer"), drawer.canvas, document),
    timer = new Time,
    ptimer = new Time;

//const C = (2 << 15) / (2 * Math.PI), C_1 = (2 * Math.PI) / (2 << 15);
const C = (2 << 14) / Math.PI, C_1 = Math.PI / (2 << 14);

let ID, STATIC = [];

function init() {
    const scale = parseFloat(localStorage.getItem("scale")),
        rsltn = parseFloat(localStorage.getItem("resolution"));
    
    document.body.appendChild(drawer.canvas);
    gui.setMouseElement(drawer.canvas);

    drawer.scale = scale || 0.05;
    drawer.resolution = rsltn || 1;
    
    new Bind(document.getElementById("menuContainer"));

    console.log("init");
}

function draw(data) {
    if(data && gui.play) {
        drawer.clear();

        for(const b of data)
            drawer.draw(b);

        for(const sb of STATIC)
            drawer.drawStatic(sb);
    }
}

function parseData(buf, byteOffset, byteLength, clbck1, clbck2 = clbck1, lastArr=Int16Array) {
    if(byteLength / 8 < 1)
        return byteOffset;

    const
        end = (byteOffset + Math.min(byteLength, buf.byteLength - byteOffset)) >> 1,
        pos = new Int16Array(buf),
        radiuses = new Uint16Array(buf),
        angles = new lastArr(buf); //Int16Array
    let i = byteOffset >> 1;
        
    clbck1(pos[i],pos[++i],radiuses[++i],angles[++i]);

    while(i<end - 1)
        clbck2(pos[++i],pos[++i],radiuses[++i],angles[++i]);

    return end << 1;
}

function makeAcc8i() {
    return Math.trunc(255 * gui.intensity);
}

function makeData() {
    const i32a = new Int32Array([0, drawer.sceneHW, drawer.sceneHH]),
        i16a = new Int16Array(i32a.buffer),
        ui8a = new Uint8Array(i32a.buffer);
        p = gui.keys.pressed;

    i16a[1] = C * gui.angle;

    i16a[0] = p.fire.makeBit(0)
            + p.forward.makeBit(1)
            + p.backward.makeBit(2)
            + p.menu.makeBit(3);
    ui8a[1] = makeAcc8i();

    return i32a.buffer;
}

const HANDLERS = new Map();

HANDLERS.set(0, (buf, boffset, blength)=>{
    //ID = blength;
    //boffset += 12;

    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        drawer.drawCircle(x,y,r/* , C_1 * a */, "#888888");
    });
    return boffset;
});

HANDLERS.set(1, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        drawer.drawCircle(x,y,r/* , C_1 * a */, "#ed9121");
    });
    return boffset;
});

HANDLERS.set(2, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        drawer.drawCircle(x,y,r/* , C_1 * a */, "#ed9121");
    });
    return boffset;
});

HANDLERS.set(7, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        drawer.observer.setProperties(x,y,r, C_1 * a);
    },
    (x,y,r,a) => {
        drawer.drawComplexCircle(x,y,r, C_1 * a);
    });
    return boffset;
});

HANDLERS.set(8, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        //drawer.drawCircle(x,y,r,"#dddddd");
        drawer.drawComplexCircle(x,y,r, C_1 * a, "#ff8888");
    });
    return boffset;
});

HANDLERS.set(10, (buf, boffset, blength)=>{
    let clbck = (x,y,r,rm) => {
        drawer.drawExplosion(x,y,r,rm);
    };

    boffset = parseData(buf, boffset, blength, clbck, clbck, Uint16Array);
    return boffset;
});

HANDLERS.set(11, (buf, boffset, blength)=>{
    let clbck = (x,y,r,rm) => {
        drawer.drawExplosionBack(x,y,r,rm);
    };

    boffset = parseData(buf, boffset, blength, clbck, clbck, Uint16Array);
    return boffset;
});

HANDLERS.set(20, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        drawer.drawCircle(x,y,r,"#ff0000");
    });
    return boffset;
});

HANDLERS.set(21, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        drawer.drawCircle(x,y,r,"#ff0000");
    });
    return boffset;
});

HANDLERS.set(33, (buf, boffset, blength)=>{
    STATIC.length = 0;
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        STATIC.push(new Simple(x,y,r, C_1 * a));
    });
    return boffset;
});

HANDLERS.set(51, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        //drawer.drawGift(x,y,r);
        drawer.drawCircle(x,y,r,"#999999");
        drawer.drawCircle(x,y,0.7 * r,"#fe7f9c");
    });
    return boffset;
});

HANDLERS.set(52, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        //drawer.drawGift(x,y,r);
        drawer.drawComplexCircle(x,y,r,0,"rgba(0,0,0,0)");
        drawer.drawComplexCircle(x,y,r,-0.5*Math.PI,"rgba(0,0,0,0)");
        drawer.drawCircle(x,y,0.3 * r,"#ed9121");
    });
    return boffset;
});

HANDLERS.set(53, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        //drawer.drawGift(x,y,r);
        drawer.drawCircle(x,y,r,"#999999");
        drawer.drawCircle(x,y,0.7 * r,"#ff0000");
    });
    return boffset;
});

HANDLERS.set(54, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        //drawer.drawGift(x,y,r);
        drawer.drawCircle(x,y,r,"#ff0000");
        drawer.drawCircle(x,y,0.7 * r,"#999999");
    });
    return boffset;
});

HANDLERS.set(55, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        //drawer.drawGift(x,y,r);
        drawer.drawCircle(x,y,r,"#999999");
        drawer.drawCircle(x,y,0.7 * r,"#ffb343");
    });
    return boffset;
});

HANDLERS.set(56, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        //drawer.drawGift(x,y,r);
        drawer.drawCircle(x,y,r,"#999999");
    });
    return boffset;
});

HANDLERS.set(57, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        //drawer.drawGift(x,y,r);
        drawer.drawCircle(x,y,r,"#999999");
    });
    return boffset;
});

HANDLERS.set(58, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        //drawer.drawGift(x,y,r);
        drawer.drawCircle(x,y,r,"#999999");
    });
    return boffset;
});

HANDLERS.set(59, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        //drawer.drawGift(x,y,r);
        drawer.drawCircle(x,y,r,"#999999");
    });
    return boffset;
});

HANDLERS.set(60, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        //drawer.drawGift(x,y,r);
        drawer.drawCircle(x,y,r,"#999999");
    });
    return boffset;
});

HANDLERS.set(61, (buf, boffset, blength)=>{
    boffset = parseData(buf, boffset, blength, (x,y,r,a) => {
        //drawer.drawGift(x,y,r);
        drawer.drawCircle(x,y,r,"#999999");
    });
    return boffset;
});

function drawJoystick() {
    let
        cx = drawer.canvas.clientWidth - 70,
        cy = drawer.canvas.clientHeight - 70,
        r = 2 * 25, sr = 20;

    drawer.drawClientCircle(cx, cy, r);

    r *= Number(gui.keys.pressed.forward);

    drawer.drawClientCircle(
        cx + r * gui.intensity * Math.cos(gui.angle),
        cy + r * gui.intensity * Math.sin(gui.angle),
        sr
    );
}

global.checkDraw = function() {
    if(Date.now() - ptimer.last > 100) {
        drawer.clear();

        drawer.draw(drawer.observer, "#ffb343"/* , "#cccccc" */);

        for(const sb of STATIC)
            drawer.drawStatic(sb);
    }
};

global.sendStatistic = function() {
    ws.send(JSON.stringify({
        userAgent: navigator.userAgent,
        width: drawer.width,
        height: drawer.height,
        scale: drawer.scale,
        ping: ptimer,
        draw: timer
    }));
    console.log("Statistic sended");
    alert("Statistic sended");
};

let handling = false;


ws.ondata = data => {
    const arr = new Uint16Array(data);
    let boffset = 4, o16 = 2;

    //console.log(`Ping: ${timer.get("ping")}, Frame time: ${timer.current>>0}`);
    ptimer.update();
    ws.send(makeData().toString2());
    
    if(handling) {
        if(arr[0] == 33)
            HANDLERS.get(33)(data, boffset + 4, 8 * arr[1]);
    } else /* if(gui.play) */ {
        handling = true;

        setTimeout(()=>{
            timer.update();

            drawer.clear();

            while(boffset + 1 < data.byteLength) {
                boffset = HANDLERS.get(arr[o16])(data, boffset + 4, 8 * arr[o16 + 1]);
                o16 = boffset >> 1;
            }
            
            drawer.draw(drawer.observer, "#ffb343"/* , "#cccccc" */);

            for(const sb of STATIC)
                drawer.drawStatic(sb);

            if(MOBILE)
                drawJoystick();

            handling = false;
        },0);
    }
};

window.onload = init;
//setTimeout(()=>{try{init()}catch(e){alert(e)}}, 0);


global.STATIC = STATIC;
global.timer = timer;
global.gui = gui;
global.drawer = drawer;
global.ws = ws;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./client/bind":1,"./client/drawer":2,"./client/gui":3,"./client/ws":6,"./data":7,"./time":10}],9:[function(require,module,exports){
Number.prototype.pow = function (num = 2) {
    return Math.pow(this, num);
};

Number.prototype.p2 = function () {
    return Math.pow(this, 2);
};

Number.prototype.p3 = function () {
    return Math.pow(this, 3);
};

Number.prototype.p4 = function () {
    return Math.pow(this, 4);
};

Number.prototype.p5 = function () {
    return Math.pow(this, 5);
};

Number.prototype.p6 = function () {
    return Math.pow(this, 6);
};

Number.prototype.sqrt = function () {
    return Math.sqrt(this);
};

Number.prototype.trunc = function () {
    return Math.trunc(this);
};

Number.prototype.abs = function () {
    return Math.abs(this);
};

Number.prototype.sign = function () {
    return Math.sign(this);
};
},{}],10:[function(require,module,exports){
(function (global){
class Time {
    updateLong() {
        this.shortest.push(this.currentShort);
        this.average.push(Math.trunc(this.sum / this.updCnt));
        this.longest.push(this.currentLong);

        this.sum = 0;
        this.currentShort = this.currentLong = this.current;

        this.onUpdateAverage(this.lastAverage);
    }

    update() {
        this.current = Date.now() - this.last;
        this.last += this.current;

        this.sum += this.current;
        
        if(this.currentShort > this.current)
            this.currentShort = this.current
        
        if(this.currentLong < this.current)
            this.currentLong = this.current

        this.fps = 1000 / this.current;

        if(this.current > this.maxDt)
            this.current = this.maxDt;

        ++this.frames;
        if(!(this.frames % this.updCnt))
            this.updateLong();

        this.dt = this.current / 1000;

        return this.dt;
    }

    get(id) {
        return ((Date.now() - this.times.get(id)) || 0)
    }

    set(id) {
        const t = Date.now();
        this.times.set(id, t);
        return t;
    }

    get lastAverage() { return this.average[this.average.length-1]; }

    constructor() {
        this.maxDt = 60;

        this.frames = 0;

        this.start = Date.now();
        this.last = Date.now();

        this.dt = 0;

        this.updCnt = 150;

        this.fps = 0;

        this.shortest = [];
        this.average = [];
        this.longest = [];

        this.sum = 0;
        this.current = 0;

        this.currentShort = 0;
        this.currentLong = 0;

        this.onUpdateAverage = ()=>{};

        this.times = new Map;
    }
};

module.exports = global.Time = Time;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[8]);

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
    fromPow = (v, s) => fromNumber(parseFloat(v), s.min, s.max, s.pow),
    toPow = (v, s) => toNumber(parseFloat(v), s.min, s.max, s.pow),
    addValueProp = (element) => {
        Object.defineProperty(element, "value", {
            get: function() {return Number(this.checked);},
            set: function(value) {this.checked = !!value;}
        });
    };

class Obj {
    get value() { return this.parentObject[this.objectName]; }
    set value(value) { this.parentObject[this.objectName] = value; }

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
        this.object = this.parentObject[this.objectName];

        if(!this.parentObject.hasOwnProperty(this.objectName))
            return;

        this.error = false;
    }

    constructor(str) {
        this.string;
        
        this.parentObject;
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
        return !!this.animation.transition;
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

    set animateValue(value) { this.animation.begin(value); }

    update() {
        if(this.isAnimator && !this.animation.gotResultState) {
            let val = this.animation.getCurrentState();

            this.value = val;
            this.handler(val, this);
        } else {
            const objVal = this.oValue;
            
            this.eValue = objVal;
            this.animation.target = objVal;
        }
    }

    updateByGroup() {
        //if(this.isAnimator && !this.animation.gotResultState)
            this.eValue = this.animation.getCurrentState();
        //this.eValue = this.animation.getCurrentState();
    }

    init(e) {
        const objprop = e.getAttribute("object");

        if(objprop) {
            this.object = new Obj(objprop);
            e.value = this.object.object;
        }
        
        this.animation.transition = parseFloat(e.getAttribute("transition")) || 0;

        this.min = parseFloat(e.min) || 0;
        this.max = parseFloat(e.max) || 1;
        this.pow = parseFloat(e.getAttribute("pow")) || 1;
        
        this.from = new Obj(e.getAttribute("from")).object || fromPow,
        this.to = new Obj(e.getAttribute("to")).object || toPow,
        this.handler = new Obj(e.getAttribute("change")).object || self;

        this.element = e;

        e.single = this;
    }

    constructor(element, handler = null) {
        this.element;
        this.object;
        this.handler; this.from; this.to;

        this.pow; this.min; this.max;

        this.animation = new Animation(0, "bezier");

        if(element.type == "checkbox" || element.type == "radio")
            addValueProp(element);

        this.oninput = handler || (event => {
            const val = this.eValue;

            this.animation.base = val;

            if(!this.isAnimator)
                this.handler(val, this);
            this.animateValue = val;
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
        this.animation.begin(value);

        for(const e of this.singles)
            e.animation.begin(value);
    }

    update() {
        if(this.isAnimator && !this.animation.gotResultState) {
            let val = this.animation.getCurrentState();
            
            this.oValue = val;
            this.handler(val, this);
        }

        for(const e of this.singles)
            e.updateByGroup();
    }

    add(e) {
        const s = new Single(e, this.oninput);

        if(
            !this.isAnimator && s.isAnimator ||
            this.animation.transition < s.animation.transition
        )
            this.animation.transition = s.animation.transition;

        if(this.handler == self)
            this.handler = s.handler;

        if(this.object) {
            s.eValue = this.object.object;
        } else if(s.object) {
            this.object = s.object;
            this.value = s.value = this.object.object;
        }
        
        this.singles.push(s);
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

            if(!this.isAnimator)
                this.handler(val, this);
            this.animateValue = val;
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

    update() {
        for(const s of this.singles)
            s.update();

        for(const g of this.groups.values())
            g.update();
    }

    addToSingle(e) {
        let s = new Single(e);

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

        const a = () => {
            requestAnimationFrame(a);
            this.update();
        }

        a();
    }

    constructor(container = document) {
        this.singles = new Array;
        this.singlesObj = new Map;
        this.groups = new Map;

        this.init(container);
    }
};

if(typeof module != 'undefined') {
    module.exports = Bind;
}
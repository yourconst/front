const Animation = require("../bind").Animation,
    Figures = require("../figures"),
    Line = require("../line"),
    THREE = require("three");//require("../three");//73//


function Beta(a) {
    //return 1.5 * a;

    let aa = Math.abs(a);
    return a + Math.pow(aa, 0.8) - Math.pow(aa, 0.6) - Math.pow(aa, 0.4) - Math.pow(aa, 0.2);
}

const vect = new THREE.Vector3;

function getPos(a, radius) {
    const b = Beta(a);
    
    vect.set(
        Math.cos(a), Math.sin(a) * Math.cos(b), Math.abs(Math.sin(b))
    ).multiplyScalar(radius);

    return vect;
}

class Visualization {
    get linesCount() { return this._linesCount; }
    set linesCount(value) {
        let len = this._lines.length;

        if(value < len) {
            //this._lines.splice(value).forEach(l => l.destructor());
/*             this._lines.slice(value).forEach(l => {
                l.copyPos();
                l.tPositions.fill(0);
            }); */
        } else if(value > len) {
            for(let i=len; i<value; ++i)
                this._lines.push(new Line().addTo(this.scene));
        }
                
        this._linesCount = value;

        this.settingChange();
    }

    get effectType() { return this._effectType; }
    set effectType(value) {
        this._effectType = value;
        this.settingChange();
    }

    get pointCount() { return this._pointCount; }
    set pointCount(value) {
        if(value == this._pointCount)
            return;

        this._pointCount = value;
        this.settingChange();
    }

    get loopsCount() { return this._loopsCount; }
    set loopsCount(value) {
        this._loopsCount = value;
        this.settingChange();
    }

    get radius() { return this.radVect.z; }
    set radius(value) { this.radVect.z = value; }

    //get multiplier() { return this.centerVect.z / 128; }
    //set multiplier(value) { this.centerVect.z = value * 128; }

    get flying() { return this._flying; }
    set flying(value) {
        value = !!value;

        if(this._flying != value) {
            var d = this.camera.position.distanceTo(
                    value ? this.posFunc(this.a, this.radius) : this.radVect
                );

            this.flyAnim.transition = d / Math.max(1, Math.abs(this.flyingSpeed)) / 2e2;
            this.flyAnim.begin(Number(value));
            this._flying = value;
        }
    }

    get transition() { return this.typeAnim.transition; }
    set transition(value) {
        //this.flyAnim.transition = value;
        this.typeAnim.transition = value;
        this.linesAnim.transition = value;
    }

    fly() {
        let rvect = this.radVect,
            tvect = this.posFunc(this.a, this.radius),
            cpos = this.camera.position;

        if(this._flying)
            this.a += 0.001 * this.flyingSpeed;

        cpos.lerpVectors(rvect, tvect, this.flyAnim.getCurrentState());

        this.camera.lookAt(this.centerVect);
    }

    settingChange() {
        console.warn(this);
        //this._lines.forEach(l => l.copyPos());
        this.typeAnim.begin(1, 0);

        this.linesAnim.begin(this.linesCount);

        let cnt = this.pointCount,
            R = 300,
            chnls = this.linesCount,
            d = R * (chnls - 1),
            et = this._effectType,
            lcnt = this._loopsCount || 0.001,
            lns = this._lines;

        lns.forEach(l => {
            l.plusX = 0;
            l.plusY = 0;
            l.plusZ = 0;
        });

        if(et == "m circle") {
            lns./* slice(0, chnls). */forEach(l => l.makeCurve(Figures.makeCircles, lcnt, cnt, R));
        } else if(et == "spiral") {
            lns./* slice(0, chnls). */forEach(l => l.makeCurve(Figures.makeSpiral, lcnt, cnt, R));
        } else if(et == "circle") {
            for(let i=0, l = chnls, dp = 2 * Math.PI / l, hp = 0.5 * Math.PI; i<lns.length; ++i) {
                let s = i % 2 ? -1 : 1, c = hp + s * Math.trunc(i / 2) * dp,
                    a = c + s * dp / 2;

                lns[i].plusX = -s * d * Math.cos(a);
                lns[i].plusY = -s * d * Math.sin(a);
                
                lns[i].makeCurve(Figures.makeCircle, cnt, R, s * hp, s * (hp + dp));
            }
        }
    }

    updateCamera() {
        this.camera.updateProjectionMatrix();
    }

    project(data) {
        const m = this.multiplier;
        
        for(let i=0; i<this.linesCount; ++i) {
            const l = this._lines[i], p = l.positions, d = data[i];
            
            for(let j=0; j < d.length; ++j)
                p[3 * j + 2] = m * d[j];

            l.geometry.attributes.position.needsUpdate = true;
        }
    }

    updateAngles() {
        let R = 300,
            chnls = this.linesAnim.getCurrentState(), //this.linesCount,
            d = R * (chnls - 1),
            lns = this._lines;

        for(let i=0, dp = 2 * Math.PI / chnls, hp = 0.5 * Math.PI; i<lns.length; ++i) {
            let s = i % 2 ? -1 : 1,
                c = hp + s * Math.trunc(i / 2) * dp,
                a = c + s * dp / 2;

            lns[i].line.rotation.z = a + Math.PI;
                
            lns[i].line.position.x = d * Math.cos(a);
            lns[i].line.position.y = d * Math.sin(a);
        }
    }

    updateLines() {
        const per = this.typeAnim.getCurrentState();

        if(!this.linesAnim.animate) {
            this._lines.splice(this.linesCount).forEach(l => l.destructor());
            //this.linesCallback(this.linesCount);
        }
        
        this._lines.forEach(l => l.percent = per);
    }

    update(data) {
        const c = this.canvas;

        if(c.lclw != c.clientWidth || c.lclh != c.clientHeight) {
            c.lclw = c.clientWidth;
            c.lclh = c.clientHeight;

            this.renderer.setSize(c.lclw, c.lclh, false);
            this.camera.aspect = c.lclw / c.lclh;
        }

        this.updateLines();
        this.project(data);
        this.fly();
        this.updateAngles();

        this.updateCamera();
        this.renderer.render( this.scene, this.camera );
    }

    init(container = document.body) {
        const size = 500;
    
        this.renderer = new THREE.WebGLRenderer(/* { alpha: true } */);
        //this.clearColor = renderer.getClearColor();
        
        this.renderer.setSize( size, size );
    
        this.scene = new THREE.Scene();
    
        this.camera = new THREE.PerspectiveCamera( 120, 1 /*window.innerWidth / window.innerHeight */, 1, 10000 );
        this.camera.position.set( 0, 0, 1000 );
        
        // canvas.width = canvas.height = size;
        this.canvas = this.renderer.domElement;
        container.appendChild( this.renderer.domElement );
    }
    
    constructor(container) {
        this.init(container);

        this._lines = [];

        this._linesCount = 0;

        this._effectType = "circle";
        this._pointCount = 32;
        this._loopsCount = 7;
        this._flying;

        this.renderer;
        this.scene;
        this.camera;

        this.canvas;

        this.posFunc = getPos;

        this.centerVect = new THREE.Vector3;
        this.radVect = new THREE.Vector3;
        
        this.multiplier = 1;

        this.a = 0;
        this.flyingSpeed = 10;
        this.flyAnim = new Animation(1.3, "bezier");
        this.flying = true;
        
        this.typeAnim = new Animation(1.3, "bezier");
        this.linesAnim = new Animation(1.3, "bezier");
    }
};

if(typeof module != 'undefined') {
    module.exports = Visualization;
}
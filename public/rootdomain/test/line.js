if(typeof require != 'undefined' && typeof THREE == 'undefined') {
    THREE = require("three");
}

if(typeof global == 'undefined') {
    global = window;
}

Object.defineProperty(THREE.Color.prototype, "value", {
    get: function() { return "#".concat(this.getHexString()); },
    set: function(color) { this.set(color); }
});

global.MATERIAL = new THREE.ShaderMaterial({
    uniforms: {
        mult: {
            type: "f",
            value: 1
        },
        color1: {
        type: "c",
        value: new THREE.Color(0x222222) //0xff1f00) //0x333333)//
        },
        color2: {
        type: "c",
        value: new THREE.Color("orange") //0x00ffff)
        }
    },
    vertexShader: `
        uniform float mult;
        varying float percent;

        void main() {
            percent = position.z / (mult * 128.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;

        varying float percent;
        
        void main() {
            gl_FragColor = vec4(mix(color1, color2, percent), 1.0);
        }
    `,
    linewidth: 3/* ,
    wireframe: true */
});

class Line {
    destructor() {
        if(this.line.parent)
            this.line.parent.remove(this.line);
    }

    copyPos() {
        for(let i=0; i<this.lPositions.length; ++i)
            this.lPositions[i] = this.positions[i];
    }
    
    settingsUpdate() {
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeBoundingSphere();
    }

    makeCurve(f) {
        /* if(this.percent == 1) */
            this.copyPos();

        this.drawCount = 0;
        f.apply(this, [this.filler].concat(Array.from(arguments).slice(1)));
        
        this.line.geometry.setDrawRange( 0, this.drawCount );
        this.settingsUpdate();

        return this;
    }

    addTo(scene) {
        scene.add(this.line);

        return this;
    }

    update() {
        const r = this._revPerc, p = this._perc;

        for(let i=0; i<this.positions.length; ++i)
            this.positions[i] = r * this.lPositions[i] + p * this.tPositions[i];
            
        this.settingsUpdate();
    }

    get percent() { return this._perc; }
    set percent(value) {
        if(this._perc == value)
            return;

        this._d = value - this._perc;
        this._lp = this._perc;
        this._lrp = this._revPerc;
        this._perc = Math.max(0, Math.min(value, 1));
        this._revPerc = 1 - this._perc;

        this.update();
    }

    constructor(max_points = 1 << 14) {
        this._perc;
        this._revPerc;
        this.positions = new Float32Array( 3 * max_points );
        this.tPositions = new Float32Array( 3 * max_points );
        this.lPositions = new Float32Array( 3 * max_points );
        this.geometry = new THREE.BufferGeometry();
        this.geometry.addAttribute( 'position', new THREE.BufferAttribute( this.positions, 3 ) );
        //this.material = new THREE.LineBasicMaterial( { color: 0x00ffff, linewidth: 1 } );
        this.line = new THREE.Line( this.geometry,  MATERIAL );

        this.line.geometry.setDrawRange( 0, 2 );

        this.plusX = 0;
        this.plusY = 0;
        this.plusZ = 0;

        this.filler = (a, r) => {
            let dc = 3 * this.drawCount;
            ++this.drawCount;

            this.tPositions[dc] = this.plusX + r * Math.cos(a);
            ++dc;
            this.tPositions[dc] = this.plusY + r * Math.sin(a);
            ++dc;
            this.tPositions[dc] = this.plusZ;
        };

        this.percent = 1;

        this.drawCount = 0;
    }
};

if(typeof module != 'undefined') {
    module.exports = Line;
}
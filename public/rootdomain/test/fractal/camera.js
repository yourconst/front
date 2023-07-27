class Point2 {
    copy(p) {
        this.x = p.x;
        this.y = p.y;

        return this;
    }

    set(x=0, y=0) {
        this.x = x;
        this.y = y;
    }
    
    constructor(x=0, y=0) {
        this.set(x,y);
    }
}

class Point3 {
    mod() {
        return Math.sqrt(
            Math.pow(this.x, 2) +
            Math.pow(this.y, 2) +
            Math.pow(this.z, 2)
        );
    }

    distanceTo(p) {
        return Math.sqrt(
            Math.pow(this.x - p.x, 2) +
            Math.pow(this.y - p.y, 2) +
            Math.pow(this.z - p.z, 2)
        );
    }

    multiplyScalar(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;

        return this;
    }

    addMultiplyScalar(p, s) {
        this.x += s * p.x;
        this.y += s * p.y;
        this.z += s * p.z;

        return this;
    }

    sub(p) {
        this.x -= p.x;
        this.y -= p.y;
        this.z -= p.z;

        return this;
    }

    add(p) {
        this.x += p.x;
        this.y += p.y;
        this.z += p.z;

        return this;
    }

    copy(p) {
        this.x = p.x;
        this.y = p.y;
        this.z = p.z;

        return this;
    }

    set(x=0, y=0, z=0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    constructor(x=0, y=0, z=0) {
        this.set(x,y,z);
    }
}

class Camera {
    lookAtCoord(x = 0, y = 0, z = 0) {
        x = this.position.x - x;
        y = this.position.y - y;
        z = this.position.z - z;

        let //r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2)),
            ax, ay, az;
        
        ay = -Math.PI/2 + Math.atan2(Math.sqrt(Math.pow(z, 2) + Math.pow(x, 2)), y);
        ax = Math.PI + Math.atan2(x, z);

        this.rotation.x = ax;
        this.rotation.y = ay;
        //this.rotation.z = az;
    }

    lookAt(p = new Point3) {
        this.lookAtCoord(p.x, p.y, p.z);
    }

    constructor(fov = 725, position = new Point3, rotation = new Point3) {
        this.velocity = new Point3();
        this.position = new Point3().copy(position);
        this.rotation = new Point3().copy(rotation);

        this.fov = fov;
    }
};

class Body {
    makeSatellite(sat, o) {
        let G = 6.67e-11;

        o = o || {};
    
        var r = this.r + o.r || (this.r + sat.r) * (3);
        var exc = /* sat.m / this.m * 0.06 *  */(o.exc || 0.5);
        var angle = o.angle || 0;
        var dir = o.dir || 1;
        var v = o.v || Math.sqrt(exc * G * this.m / r);

        console.log(exc, r, v);
    
    
        var x = r * Math.cos(angle),
            y = r * Math.sin(angle),
            vx = dir * v * Math.cos(angle + Math.PI / 2),
            vy = dir * v * Math.sin(angle + Math.PI / 2);
    
        sat.position.x = this.position.x + x;
        sat.position.y = this.position.y;
        sat.position.z = this.position.z + y;

        sat.velocity.x = this.velocity.x + vx;
        sat.velocity.y = this.velocity.y;
        sat.velocity.z = this.velocity.z + vy;
    }

    distanceTo(p) {
        return this.position.distanceTo(p.position);
    }

    get radius() { return this.r; }
    set radius(value) {
        this.m = this.d * 4 / 3 * Math.PI * Math.pow(value, 3);
        this.r = value;
    }

    get mass() { return this.m; }
    set mass(value) {
        this.r = Math.sqrt(value * 3 / (this.d * 4 * Math.PI));
        this.m = value;
    }

    get density() { return this.d; }
    set density(value) {
        this.d = value;
        this.radius = this.r;
    }

    update(dt) {
        let a = this.acceleration, v = this.velocity, p = this.position;

        p.addMultiplyScalar(v, dt);
        p.addMultiplyScalar(a, Math.pow(dt, 2));

        v.addMultiplyScalar(a, dt);

        a.set(0,0,0);
    }

    constructor(radius = 1e2, density = 1e3, position = new Point3) {
        this.r; this.m;
        this.d = density;

        this.radius = radius;

        this.acceleration = new Point3();
        this.velocity = new Point3();
        this.position = new Point3().copy(position);
    }
};

Object.defineProperty(CanvasRenderingContext2D.prototype, "imageData", {
    get: function() {
        let c = this.canvas;
    
        return this.getImageData(0,0,c.width,c.height);
    },
    set(value) {
        /* let c = this.canvas; */

        this.putImageData(value, 0, 0/* , c.width, c.height */);
    }
});

Object.defineProperty(CanvasRenderingContext2D.prototype, "cleanImageData", {
    get: function() {
        let c = this.canvas;
    
        return this.createImageData(c.width,c.height);
    }
});

Object.defineProperty(CanvasRenderingContext2D.prototype, "drawFull", {
    value: function(src) {
        let c = this.canvas;
    
        this.drawImage(src, 0, 0, c.width, c.height);
    }
});

Object.defineProperty(ImageData.prototype, "clear", {
    value: function() {
        let d = this.data,
            l = d.length, gray = 0, opacity = 255;
    
        for(var i=0; i<l; ++i) {
            d[i]=d[++i]=d[++i] = gray;
            d[++i] = opacity;
        }
    }
});

class Renderer {
    get cleanImageData() { return this.ctx.cleanImageData; }

    get width() { return this.canvas.width; }
    set width(value) {
        this.canvas.width = value;
        this.onchange();
    }

    get height() { return this.canvas.height; }
    set height(value) {
        this.canvas.height = value;
        this.onchange();
    }

    get hWidth() { return this.width >> 1; }
    get hHeight() { return this.height >> 1; }

    appendTo(parent) {
        parent.appendChild(this.canvas);
        this.onchange();
    }

    render(imageData) {
        this.ctx.imageData = imageData;
    }

    constructor(width = 300, height = 200) {
        this.domElement = document.createElement("canvas");
        this.canvas = this.domElement;
        this.ctx = this.canvas.getContext("2d");

        this.onchange = event => {};

        this.width = width;
        this.height = height;
    }
};
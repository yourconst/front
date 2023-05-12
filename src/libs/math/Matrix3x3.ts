import type { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";

interface NumberArray {
    readonly length: number;
    [index: number]: number;
}

const multiply3x3 = (l: number[], r: number[], t = new Array<number>(9)) => {
    t[0] = l[0]*r[0] + l[1]*r[3] + l[2]*r[6];
    t[1] = l[0]*r[1] + l[1]*r[4] + l[2]*r[7];
    t[2] = l[0]*r[2] + l[1]*r[5] + l[2]*r[8];

    t[3] = l[3]*r[0] + l[4]*r[3] + l[5]*r[6];
    t[4] = l[3]*r[1] + l[4]*r[4] + l[5]*r[7];
    t[5] = l[3]*r[2] + l[4]*r[5] + l[5]*r[8];

    t[6] = l[6]*r[0] + l[7]*r[3] + l[8]*r[6];
    t[7] = l[6]*r[1] + l[7]*r[4] + l[8]*r[7];
    t[8] = l[6]*r[2] + l[7]*r[5] + l[8]*r[8];
    
    return t;
};

const transpose = (s: number[], t = s.slice()) => {
    t[1] = s[3]; t[3] = s[1];
    t[2] = s[6]; t[6] = s[2];
    t[5] = s[7]; t[7] = s[5];

    return t;
};

const rotationX = (ax: number) => {
    const cosx = Math.cos(ax), sinx = Math.sin(ax);
    return [
        1, 0, 0,
        0, cosx, -sinx,
        0, sinx, cosx,
    ];
};
const rotationY = (ay: number) => {
    const cosy = Math.cos(ay), siny = Math.sin(ay);
    return [
        cosy, 0, siny,
        0, 1, 0,
        -siny, 0, cosy,
    ];
};
const rotationZ = (az: number) => {
    const cosz = Math.cos(az), sinz = Math.sin(az);
    return [
        cosz, -sinz, 0,
        sinz, cosz, 0,
        0, 0, 1,
    ];
};

export class Matrix3x3 {
    static createIdentity() {
        return new Matrix3x3([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ]);
    }

    // https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
    static createRotationFromQuaternion(q: Quaternion) {
        const { r: w, i: { x, y, z } } = q;

        return new Matrix3x3([
            w*w + x*x - y*y - z*z, 2*(x*y - w*z),         2*(w*y + x*z),
            2*(x*y + z*w),         w*w - x*x + y*y - z*z, 2*(y*z - x*w),
            2*(x*z - y*w),         2*(y*z + x*w),         w*w - x*x - y*y + z*z,
        ]);
    }

    static createRotationFromQuaternionInhomogenegeneous(q: Quaternion) {
        // a /= 2;
        // d = d.clone().multiplyN(Math.sin(a));
        // const w = Math.cos(a);
        // const cos = Math.cos(a), sin = Math.sin(a);
        const d = q.i;
        const w = q.r;

        return new Matrix3x3([
            1 - 2*(d.y**2) - 2*(d.z**2), 2*d.x*d.y - 2*d.z*w,         2*d.x*d.z + 2*d.y*w,
            2*d.x*d.y + 2*d.z*w,         1 - 2*(d.x**2) - 2*(d.z**2), 2*d.y*d.z - 2*d.x*w,
            2*d.x*d.z - 2*d.y*w,         2*d.y*d.z + 2*d.x*w,         1 - 2*(d.x**2) - 2*(d.y**2),
        ]);
    }

    static createRotationAroundAxis(d: Vector3, a: number) {
        const cos = Math.cos(a), sin = Math.sin(a);
        const rcos = 1 - cos;

        return new Matrix3x3([
            cos + rcos*(d.x**2),    rcos*d.x*d.y - sin*d.z, rcos*d.x*d.z + sin*d.y,
            rcos*d.y*d.x + sin*d.z, cos + rcos*(d.y**2),    rcos*d.y*d.z - sin*d.x,
            rcos*d.z*d.x - sin*d.y, rcos*d.z*d.y + sin*d.x, cos + rcos*(d.z**2),
        ]);
    }

    static createRotationX(ax: number) {
        return new Matrix3x3(rotationX(ax));
    }
    static createRotationY(ay: number) {
        return new Matrix3x3(rotationY(ay));
    }
    static createRotationZ(az: number) {
        return new Matrix3x3(rotationZ(az));
    }

    static createRotationFromAngles(as: Vector3, order: ('X' | 'Y' | 'Z')[]) {
        let result: Matrix3x3;

        for (const a of order) {
            let tmp: Matrix3x3;
            // Matrix3x3[`createRotation${a}`](as[a.toLowerCase()]);
            if (a === 'X') tmp = this.createRotationX(as.x); else
            if (a === 'Y') tmp = this.createRotationY(as.y); else
            if (a === 'Z') tmp = this.createRotationZ(as.z);
            
            if (result) {
                result = result.multiply3x3(tmp);
            } else {
                result = tmp;
            }
        }

        return result;
    }

    static createRotationFromAnglesXYZ(as: Vector3) {
        const c = rotationX(as.x);
        multiply3x3(c.slice(), rotationY(as.y), c);
        multiply3x3(c.slice(), rotationZ(as.z), c);
        return new Matrix3x3(c);
    }

    static createRotationFromAnglesZYX(as: Vector3) {
        const c = rotationZ(as.z);
        multiply3x3(c.slice(), rotationY(as.y), c);
        multiply3x3(c.slice(), rotationX(as.x), c);
        return new Matrix3x3(c);
    }

    constructor(public cells: number[]) { }

    clone() {
        return new Matrix3x3(this.cells.slice());
    }

    setIdentity() {
        const tc = this.cells;
        tc[0] = 1; tc[1] = 0; tc[2] = 0;
        tc[3] = 0; tc[4] = 1; tc[5] = 0;
        tc[6] = 0; tc[7] = 0; tc[8] = 1;
        return this;
    }

    set(m: Matrix3x3) {
        const tc = this.cells;
        const mc = m.cells;
        tc[0] = mc[0]; tc[1] = mc[1]; tc[2] = mc[2];
        tc[3] = mc[3]; tc[4] = mc[4]; tc[5] = mc[5];
        tc[6] = mc[6]; tc[7] = mc[7]; tc[8] = mc[8];
        return this;
    }

    determinant() {
        const c = this.cells;
        return c[0]*c[4]*c[8] + c[1]*c[5]*c[6] + c[2]*c[3]*c[7] -
            c[2]*c[4]*c[5] - c[1]*c[3]*c[8] - c[0]*c[5]*c[7];
    }

    normalize() {
        this.multiplyN(1 / Math.pow(this.determinant(), 1 / 3));
        return this;
    }

    transpose() {
        transpose(this.cells.slice(), this.cells);
        return this;
    }

    transposeNew() {
        return new Matrix3x3(transpose(this.cells));
    }

    multiplyN(n: number) {
        const c = this.cells;
        c[0] *= n; c[1] *= n; c[2] *= n;
        c[3] *= n; c[4] *= n; c[5] *= n;
        c[6] *= n; c[7] *= n; c[8] *= n;
        return this;
    }

    multiply3x3(m: Matrix3x3) {
        multiply3x3(this.cells.slice(), m.cells, this.cells);
        return this;
    }

    multiply3x3Left(m: Matrix3x3) {
        multiply3x3(m.cells, this.cells.slice(), this.cells);
        return this;
    }

    multiply3x3New(m: Matrix3x3) {
        return new Matrix3x3(multiply3x3(this.cells, m.cells));
    }

    multiplyVector3Column(v3: Vector3) {
        return new Vector3(
            this.cells[0] * v3.x + this.cells[1] * v3.y + this.cells[2] * v3.z,
            this.cells[3] * v3.x + this.cells[4] * v3.y + this.cells[5] * v3.z,
            this.cells[6] * v3.x + this.cells[7] * v3.y + this.cells[8] * v3.z,
        );
    }

    multiplyVector3RowLeft(v3: Vector3) {
        return new Vector3(
            this.cells[0] * v3.x + this.cells[3] * v3.y + this.cells[6] * v3.z,
            this.cells[1] * v3.x + this.cells[4] * v3.y + this.cells[7] * v3.z,
            this.cells[2] * v3.x + this.cells[5] * v3.y + this.cells[8] * v3.z,
        );
    }

    rotateAbsoluteX(ax: number) {
        multiply3x3(this.cells.slice(), rotationX(ax), this.cells);
        return this;
    }
    rotateAbsoluteY(ay: number) {
        multiply3x3(this.cells.slice(), rotationY(ay), this.cells);
        return this;
    }
    rotateAbsoluteZ(az: number) {
        multiply3x3(this.cells.slice(), rotationZ(az), this.cells);
        return this;
    }

    rotateRelativeX(ax: number) {
        multiply3x3(rotationX(ax), this.cells.slice(), this.cells);
        return this;
    }
    rotateRelativeY(ay: number) {
        multiply3x3(rotationY(ay), this.cells.slice(), this.cells);
        return this;
    }
    rotateRelativeZ(az: number) {
        multiply3x3(rotationZ(az), this.cells.slice(), this.cells);
        return this;
    }
}

globalThis['Matrix3x3'] = Matrix3x3;

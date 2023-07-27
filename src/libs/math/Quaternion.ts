import { Vector2 } from "./Vector2";
import { Vector3 } from "./Vector3";

// TODO
export class Quaternion {
    static _mutCreateRotationFromDirectionAngle(v: Vector3, angle: number) {
        angle /= 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        return new Quaternion(v.multiplyN(sin), /* v.length() *  */cos);
    }

    static createRotationFromDirectionAngle(v: Vector3, angle: number) {
        return this._mutCreateRotationFromDirectionAngle(v.clone(), angle);
    }

    static createRotationX(ax: number) {
        return Quaternion._mutCreateRotationFromDirectionAngle(new Vector3(1, 0, 0), ax);
    }
    static createRotationY(ay: number) {
        return Quaternion._mutCreateRotationFromDirectionAngle(new Vector3(0, 1, 0), ay);
    }
    static createRotationZ(az: number) {
        return Quaternion._mutCreateRotationFromDirectionAngle(new Vector3(0, 0, 1), az);
    }

    constructor(public i = new Vector3, public r = 1) { }

    clone() {
        return new Quaternion(this.i.clone(), this.r);
    }

    set(q: Quaternion) {
        this.i.set(q.i);
        this.r = q.r;
        return this;
    }

    plus(q: Quaternion) {
        this.r += q.r;
        this.i.plus(q.i);
        return this;
    }

    minus(q: Quaternion) {
        this.r -= q.r;
        this.i.minus(q.i);
        return this;
    }

    multiplyN(n: number) {
        this.r *= n;
        this.i.multiplyN(n);
        return this;
    }
    divideN(n: number) {
        this.r /= n;
        this.i.divideN(n);
        return this;
    }

    length2() {
        return this.r * this.r + this.i.length2();
    }
    length() {
        return Math.sqrt(this.length2());
    }

    normalize(l = 1) {
        return this.multiplyN(l / (this.length() || 1));
    }

    inverse() {
        this.i.multiplyN(-1);
        return this;
    }


    multiply(q: Quaternion) {
        const tr = this.r;
        
        this.r = tr * q.r - this.i.dot(q.i);
        this.i.set(
            q.i.clone().multiplyN(tr)
                .plus(this.i.clone().multiplyN(q.r))
                .plus(this.i.cross(q.i)),
        );

        return this;
    }
    // TODO: fix
    multiplyLeft(q: Quaternion) {
        // const tr = this.r;
        
        // this.r = q.r * tr - q.i.dot(this.i);
        // this.i.multiplyN(q.r)
        //     .plus(q.i.clone().multiplyN(tr))
        //     .plus(q.i.cross(this.i));

        this.set(q.clone().multiply(this));

        return this;
    }

    rotateVector(qi: Vector3) {
        const temp = qi.clone().multiplyN(this.r).plus(this.i.cross(qi));
        return this.i.cross(temp).multiplyN(2).plus(qi);
    }
    rotateVectorInverse(qi: Vector3) {
        const ii = this.i.clone().multiplyN(-1);
        const temp = qi.clone().multiplyN(this.r).plus(ii.cross(qi));
        return ii.cross(temp).multiplyN(2).plus(qi);
    }

    rotateAbsoluteX(ax: number) {
        return this.multiply(Quaternion.createRotationX(ax));
    }
    rotateAbsoluteY(ay: number) {
        return this.multiply(Quaternion.createRotationY(ay));
    }
    rotateAbsoluteZ(az: number) {
        return this.multiply(Quaternion.createRotationZ(az));
    }

    rotateRelativeX(ax: number) {
        return this.multiplyLeft(Quaternion.createRotationX(ax));
    }
    rotateRelativeY(ay: number) {
        return this.multiplyLeft(Quaternion.createRotationY(ay));
    }
    rotateRelativeZ(az: number) {
        return this.multiplyLeft(Quaternion.createRotationZ(az));
    }


    // https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
    angleX() {
        return Math.atan2(
            2 * (this.r * this.i.x + this.i.y * this.i.z),
            1 - 2 * (this.i.x**2 + this.i.y**2),
        );
    }
    angleY() {
        return 2 * Math.atan2(
            Math.sqrt(1 + 2 * (this.r*this.i.y - this.i.x*this.i.z)),
            Math.sqrt(1 - 2 * (this.r*this.i.y - this.i.x*this.i.z)),
        ) - Math.PI / 2;
    }
    angleZ() {
        return Math.atan2(
            2 * (this.r * this.i.z + this.i.x * this.i.y),
            1 - 2 * (this.i.y**2 + this.i.z**2),
        );
    }
    // TODO: check
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/
    angles() {
        return new Vector3(this.angleX(), this.angleY(), this.angleZ());
    }

    angleDirection() {
        return 2 * Math.atan2(this.i.length(), this.r);
    }

    direction() {
        // return this.i.clone().divideN(Math.sin(this.angleDirection() / 2));
        return new Vector3(
            2 * (this.i.x * this.i.z - this.r * this.i.y),
            2 * (this.i.y * this.i.z + this.r * this.i.x),
            1 - 2 * (this.i.x * this.i.x + this.i.y * this.i.y),
        );
        // return this.i.clone().divideN(this.i.length());
    }

    setDirection(d: Vector3) {
        // const angle = /* (this.angleDirection() / 2) ||  */(globalThis['QAD']/*  / 2 */);
        // const cos = Math.cos(angle);
        // const sin = Math.sin(angle);
        // this.r = cos;
        // this.i.set(d).normalize().multiplyN(sin);

        // console.log(d, this.direction());

        const z = Math.sqrt(d.xy.length2() / (2 * (1 - d.z)));
        this.i.setN(
            d.x / (2 * z),
            d.y / (2 * z),
            z,
        );
        this.r = 0;

        return this;
    }
}

globalThis['QAD'] = Math.PI / 2;
globalThis['Quaternion'] = Quaternion;

/* 
Otiginal:
https://stackoverflow.com/questions/9037174/glsl-rotation-with-a-rotation-vector

vec3 temp = cross(q.xyz, v) + q.w * v;
vec3 rotated = v + 2.0*cross(q.xyz, temp);

js:
const v = new Vector2(1, 0, 0);
const n = new Vector2(0, 1, 0);
const angle = Math.PI / 2;

const cos = Math.cos(angle / 2);
const sin = Math.sin(angle / 2);

const q = n.clone().multiplyN(sin);
const qw = cos;

const temp = q.clone().cross(v).plus(v.clone().multiplyN(qw));
const result = q.clone().cross(temp).multiplyN(2).plus(v);

result;
*/

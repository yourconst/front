import { Vector3 } from "./Vector3";

// TODO
export class Quaternion {
    static createToRotateAroundVectorByAngle(v: Vector3, angle: number) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        return new Quaternion(cos, v.clone().multiplyN(sin));
    }

    constructor(public real = 0, public im = new Vector3) { }

    clone() {
        return new Quaternion(this.real, this.im);
    }

    plus(q: Quaternion) {
        this.real += q.real;
        this.im.plus(q.im);
        return this;
    }

    minus(q: Quaternion) {
        this.real -= q.real;
        this.im.minus(q.im);
        return this;
    }

    multiplyNew(q: Quaternion) {
        return new Quaternion(
            this.real * q.real - this.im.dot(q.im),
            q.im.clone().multiplyN(this.real)
                .plus(this.im.clone().multiplyN(q.real))
                .plus(this.im.cross(q.im)),
        );
    }

    multiplyImV3(qim: Vector3) {
        const temp = qim.clone().multiplyN(this.real).plus(this.im.cross(qim));
        return this.im.cross(temp).multiplyN(2).plus(qim);
    }
}

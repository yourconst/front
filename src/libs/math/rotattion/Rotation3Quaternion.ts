import { Matrix3x3 } from "../Matrix3x3";
import { Quaternion } from "../Quaternion";
import { Vector3 } from "../Vector3";
import type { IRotation3 } from "./IRotation3";

export class Rotation3Quaternion implements IRotation3 {
    static createX(a: number) {
        return new Rotation3Quaternion(Quaternion.createRotationX(a));
    }
    static createY(a: number) {
        return new Rotation3Quaternion(Quaternion.createRotationY(a));
    }
    static createZ(a: number) {
        return new Rotation3Quaternion(Quaternion.createRotationZ(a));
    }
    static createNXYZ(ax: number, ay: number, az: number) {
        return new Rotation3Quaternion(
            Quaternion.createRotationX(ax).rotateAbsoluteY(ay).rotateAbsoluteZ(az),
        );
    }
    static createXYZ(a: Vector3) {
        return Rotation3Quaternion.createNXYZ(a.x, a.y, a.z);
    }

    constructor(public q: Quaternion) {}
    
    clone() {
        return new Rotation3Quaternion(this.q.clone());
    }

    matrix() {
        return Matrix3x3.createRotationFromQuaternion(this.q);
    }

    reset() {
        this.setNXYZ(0, 0, 0);
        return this;
    }

    setNXYZ(ax: number, ay: number, az: number) {
        this.q.set(Quaternion.createRotationX(ax))
            .rotateAbsoluteY(ay)
            .rotateAbsoluteZ(az);
        return this;
    }
    setXYZ(a: Vector3) {
        return this.setNXYZ(a.x, a.y, a.z);
    };

    rotateAbsoluteX(ax: number) {
        this.q.rotateAbsoluteX(ax);
        return this;
    }
    rotateAbsoluteY(ay: number) {
        this.q.rotateAbsoluteY(ay);
        return this;
    }
    rotateAbsoluteZ(az: number) {
        this.q.rotateAbsoluteZ(az);
        return this;
    }
    
    rotateRelativeX(ax: number) {
        this.q.rotateRelativeX(ax);
        return this;
    }
    rotateRelativeY(ay: number) {
        this.q.rotateRelativeY(ay);
        return this;
    }
    rotateRelativeZ(az: number) {
        this.q.rotateRelativeZ(az);
        return this;
    }

    getAbsoluteVector(rv: Vector3) {
        return this.q.rotateVectorInverse(rv);
    }
    getRelativeVector(av: Vector3) {
        return this.q.rotateVector(av);
    }

    forwardDirection() {
        return this.getAbsoluteVector(new Vector3(0, 0, 1));
    }
    topDirection() {
        return this.getAbsoluteVector(new Vector3(0, 1, 0));
    }
    rightDirection() {
        return this.getAbsoluteVector(new Vector3(1, 0, 0));
    }
}

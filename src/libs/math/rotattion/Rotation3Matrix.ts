import { Matrix3x3 } from "../Matrix3x3";
import { Vector3 } from "../Vector3";
import type { IRotation3 } from "./IRotation3";

export class Rotation3Matrix implements IRotation3 {
    static createX(a: number) {
        return new Rotation3Matrix(Matrix3x3.createRotationX(a));
    }
    static createY(a: number) {
        return new Rotation3Matrix(Matrix3x3.createRotationY(a));
    }
    static createZ(a: number) {
        return new Rotation3Matrix(Matrix3x3.createRotationZ(a));
    }
    static createNXYZ(ax: number, ay: number, az: number) {
        return new Rotation3Matrix(
            Matrix3x3.createRotationX(ax).rotateAbsoluteY(ay).rotateAbsoluteZ(az),
        );
    }
    static createXYZ(a: Vector3) {
        return Rotation3Matrix.createNXYZ(a.x, a.y, a.z);
    }

    constructor(public m: Matrix3x3) { }
    
    clone() {
        return new Rotation3Matrix(this.m.clone());
    }

    matrix() {
        return this.m.clone();
    }

    reset() {
        this.m.setIdentity();
        return this;
    }

    setNXYZ(ax: number, ay: number, az: number) {
        this.m.set(Matrix3x3.createRotationX(ax))
            .rotateAbsoluteY(ay)
            .rotateAbsoluteZ(az);
        return this;
    }
    setXYZ(a: Vector3) {
        return this.setNXYZ(a.x, a.y, a.z);
    };

    rotateAbsoluteX(ax: number) {
        this.m.rotateAbsoluteX(ax);
        return this;
    }
    rotateAbsoluteY(ay: number) {
        this.m.rotateAbsoluteY(ay);
        return this;
    }
    rotateAbsoluteZ(az: number) {
        this.m.rotateAbsoluteZ(az);
        return this;
    }
    
    rotateRelativeX(ax: number) {
        this.m.rotateRelativeX(ax);
        return this;
    }
    rotateRelativeY(ay: number) {
        this.m.rotateRelativeY(ay);
        return this;
    }
    rotateRelativeZ(az: number) {
        this.m.rotateRelativeZ(az);
        return this;
    }

    getAbsoluteVector(rv: Vector3) {
        return this.m.multiplyVector3RowLeft(rv);
    }
    getRelativeVector(av: Vector3) {
        return this.m.multiplyVector3Column(av);
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

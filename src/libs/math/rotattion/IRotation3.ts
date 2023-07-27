import type { Matrix3x3 } from "../Matrix3x3";
import type { Vector3 } from "../Vector3";

export interface IRotation3Constructor {
    new(...params): IRotation3;

    createX(a: number): IRotation3;
    createY(a: number): IRotation3;
    createZ(a: number): IRotation3;

    createNXYZ(ax: number, ay: number, az: number): IRotation3;
    createXYZ(a: Vector3): IRotation3;
}

export interface IRotation3 {
    // constructor: IRotation3Constructor;

    clone(): IRotation3;

    matrix(): Matrix3x3;

    reset(): this;

    setNXYZ(ax: number, ay: number, az: number): this;
    setXYZ(a: Vector3): this;

    rotateAbsoluteX(a: number): this;
    rotateAbsoluteY(a: number): this;
    rotateAbsoluteZ(a: number): this;
    
    rotateRelativeX(a: number): this;
    rotateRelativeY(a: number): this;
    rotateRelativeZ(a: number): this;

    getAbsoluteVector(rv: Vector3): Vector3;
    getRelativeVector(av: Vector3): Vector3;

    forwardDirection(): Vector3;
    topDirection(): Vector3;
    rightDirection(): Vector3;

    setDirection(d: Vector3): this;
}

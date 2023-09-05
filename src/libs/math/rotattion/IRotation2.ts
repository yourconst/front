import type { Vector2 } from "../Vector2";

export interface IRotation2Constructor {
    new(...params): IRotation2;

    create(a?: number): IRotation2;
}

export interface IRotation2 {
    // constructor: IRotation2Constructor;

    clone(): IRotation2;

    reset(): this;

    set(a: number): this;

    setDirection(d: Vector2): this;

    rotate(da: number): this;

    getAbsoluteVector(rv: Vector2): Vector2;
    getRelativeVector(av: Vector2): Vector2;
}

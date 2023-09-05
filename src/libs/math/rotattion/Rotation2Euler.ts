import { Vector2 } from "../Vector2";
import type { IRotation2 } from "./IRotation2";

export class Rotation2Euler implements IRotation2 {
    static create(a = 0) {
        return new Rotation2Euler(a);
    }

    constructor(protected _a = 0, protected _sc?: Vector2) {
        if (this._sc) {
            return;
        }
        this._sc = Vector2.fromAngle(this._a);
    }

    set a(v: number) {
        this._sc.setByAngle(v);
        this._a = v;
    }
    get a() {
        return this._a;
    }

    clone() {
        return new Rotation2Euler(this._a, this._sc.clone());
    }

    set(a: number) {
        this.a = a;
        return this;
    }

    reset() {
        this.a = 0;
        return this;
    }

    rotate(da: number) {
        this.a += da;
        return this;
    }

    setDirection(d: Vector2) {
        this._a = this._sc.set(d).normalize().getAngle();
        return this;
    }

    getAbsoluteVector(rv: Vector2) {
        return rv.clone().rotateBySC(this._sc, -1);
    }

    getRelativeVector(av: Vector2) {
        return av.clone().rotateBySC(this._sc, 1);
    }
}

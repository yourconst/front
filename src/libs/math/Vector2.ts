import { Helpers } from "../../helpers/common";

export class Vector2 {
    static fromAngle(a = 0, r = 1) {
        return new Vector2(Math.cos(a) * r, Math.sin(a) * r);
    }

    static createRandom(max = 1, min = 0) {
        return new Vector2(
            Helpers.rand(max, min),
            Helpers.rand(max, min),
        );
    }

    static Shell: typeof Vector2Shell;

    // static createShell<T>(target: T, xprop: keyof T, yprop: keyof T) {
    //     return new Vector2Shell(target, xprop, yprop);
    // }

    constructor(public x = 0, public y = 0) { }

    getArray() {
        return <[number, number]>[this.x, this.y];
    }

    clone() {
        return new Vector2(this.x, this.y);
    }
    
    setXIfNull(x = 1) {
        if (this.x === 0 && this.y === 0) {
            this.x = x;
        }
        return this;
    }

    isEquals(v: Vector2) {
        return this.x === v.x && this.y === v.y;
    }

    isEqualsN(x: number, y: number) {
        return this.x === x && this.y === y;
    }

    getSinCos() {
        return {
            x: Vector2.fromAngle(this.x),
            y: Vector2.fromAngle(this.y),
        };
    }

    maxComponent() {
        return Math.max(this.x, this.y);
    }

    minComponent() {
        return Math.min(this.x, this.y);
    }

    maxSet(v: Vector2) {
        this.x = Math.max(this.x, v.x);
        this.y = Math.max(this.y, v.y);

        return this;
    }

    minSet(v: Vector2) {
        this.x = Math.min(this.x, v.x);
        this.y = Math.min(this.y, v.y);

        return this;
    }

    maxSetN(x: number, y: number) {
        this.x = Math.max(this.x, x);
        this.y = Math.max(this.y, y);

        return this;
    }

    minSetN(x: number, y: number) {
        this.x = Math.min(this.x, x);
        this.y = Math.min(this.y, y);

        return this;
    }

    set(v: Vector2) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    setN(x = this.x, y = this.y) {
        this.x = x;
        this.y = y;
        return this;
    }

    setByAngle(a: number, r = 1) {
        this.x = Math.cos(a) * r;
        this.y = Math.sin(a) * r;
        return this;
    }

    trunc() {
        this.x = Math.trunc(this.x);
        this.y = Math.trunc(this.y);

        return this;
    }

    ceil() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);

        return this;
    }

    min() {
        return Math.min(this.x, this.y);
    }

    max() {
        return Math.max(this.x, this.y);
    }

    plus(v: Vector2) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    minus(v: Vector2) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    multiply(v: Vector2) {
        this.x *= v.x;
        this.y *= v.y;

        return this;
    }

    multiplyN(n: number) {
        this.x *= n;
        this.y *= n;

        return this;
    }

    divide(v: Vector2) {
        this.x /= v.x;
        this.y /= v.y;

        return this;
    }

    divideN(n: number) {
        this.x /= n;
        this.y /= n;

        return this;
    }

    length2() {
        return this.x * this.x + this.y * this.y;
    }

    length() {
        return Math.sqrt(this.length2());
    }

    normalize(r = 1) {
        return this.multiplyN(r / (this.length() || 1));
    }

    distance2To(v: Vector2) {
        return this.clone().minus(v).length2();
    }

    distanceTo(v: Vector2) {
        return this.clone().minus(v).length();
    }

    rotate(a = 0) {
        const { x, y } = this;
        const cos = Math.cos(a), sin = Math.sin(a);

        this.x = x * cos - y * sin;
        this.y = x * sin + y * cos;

        return this;
    }

    rotateBySC(sc: Vector2, sign = 1) {
        const { x, y } = this;
        const cos = sc.x, sin = sign * sc.y;

        this.x = x * cos - y * sin;
        this.y = x * sin + y * cos;

        return this;
    }

    getAngle() {
        return Math.atan2(this.y, this.x);
    }

    rectSquare() {
        return this.x * this.y;
    }
}

// export type KeysMatching<T extends object, V> = {
//     [K in keyof T]-?: T[K] extends V ? K : never
// }[keyof T];

export class Vector2Shell<
    T extends any,
    ValidProps extends keyof T = keyof T
    /* , ValidProps extends KeysMatching<T, number> = KeysMatching<T, number> */
> extends Vector2 {
    constructor(private readonly _target: T, private readonly _xprop: ValidProps, private readonly _yprop: ValidProps) {
        // @ts-ignore
        super(_target[_xprop], _target[_yprop]);
    }

    // @ts-ignore
    get x() { return this._target?.[this._xprop]; }
    // @ts-ignore
    set x(v) { if (this._target) this._target[this._xprop] = v; }

    // @ts-ignore
    get y() { return this._target?.[this._yprop]; }
    // @ts-ignore
    set y(v) { if (this._target) this._target[this._yprop] = v; }
}

Vector2.Shell = Vector2Shell;

globalThis['Vector2'] = Vector2;

import { Helpers } from "../../helpers/common";
import { Ray3 } from "./Ray3";
import { Vector2, Vector2Shell } from "./Vector2";

export class Vector3 {
    static createRandom(max = 1, min = 0) {
        return new Vector3(
            Helpers.rand(max, min),
            Helpers.rand(max, min),
            Helpers.rand(max, min),
        );
    }

    static Shell: typeof Vector3Shell;

    constructor(public x = 0, public y = 0, public z = 0) {}

    //#region ACCESSORS
    private _xy?: Vector2Shell<this>;
    get xy() { return (this._xy ??= new Vector2.Shell(this, 'x', 'y')); }
    private _xz?: Vector2Shell<this>;
    get xz() { return (this._xz ??= new Vector2.Shell(this, 'x', 'z')); }
    private _yz?: Vector2Shell<this>;
    get yz() { return (this._yz ??= new Vector2.Shell(this, 'y', 'z')); }
    private _yx?: Vector2Shell<this>;
    get yx() { return (this._yx ??= new Vector2.Shell(this, 'y', 'x')); }
    private _zx?: Vector2Shell<this>;
    get zx() { return (this._zx ??= new Vector2.Shell(this, 'z', 'x')); }
    private _zy?: Vector2Shell<this>;
    get zy() { return (this._zy ??= new Vector2.Shell(this, 'z', 'y')); }
    //#endregion ACCESSORS

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    cloneXY() {
        return new Vector2(this.x, this.y);
    }
    
    setXIfNull(x = 1) {
        if (this.x === 0 && this.y === 0 && this.z === 0) {
            this.x = x;
        }
        return this;
    }

    isEquals(v: Vector3) {
        return this.x === v.x && this.y === v.y && this.z === v.z;
    }

    isEqualsN(x = this.x, y = this.y, z = this.z) {
        return (this.x === x) && (this.y === y) && (this.z === z);
    }

    getSinCos() {
        return {
            x: Vector2.fromAngle(this.x),
            y: Vector2.fromAngle(this.y),
            z: Vector2.fromAngle(this.z),
        };
    }

    maxComponent() {
        return Math.max(this.x, this.y, this.z);
    }

    minComponent() {
        return Math.min(this.x, this.y, this.z);
    }

    maxSet(v: Vector3) {
        this.x = Math.max(this.x, v.x);
        this.y = Math.max(this.y, v.y);
        this.z = Math.max(this.z, v.z);

        return this;
    }

    minSet(v: Vector3) {
        this.x = Math.min(this.x, v.x);
        this.y = Math.min(this.y, v.y);
        this.z = Math.min(this.z, v.z);

        return this;
    }

    maxSetN(x: number, y: number, z: number) {
        this.x = Math.max(this.x, x);
        this.y = Math.max(this.y, y);
        this.z = Math.max(this.z, z);

        return this;
    }

    minSetN(x: number, y: number, z: number) {
        this.x = Math.min(this.x, x);
        this.y = Math.min(this.y, y);
        this.z = Math.min(this.z, z);

        return this;
    }

    moduloN(n: number) {
        this.x %= n;
        this.y %= n;
        this.z %= n;

        return this;
    }

    set(v: Vector3) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;

        return this;
    }

    setN(x = this.x, y = this.y, z = this.z) {
        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    }

    trunc() {
        this.x = Math.trunc(this.x);
        this.y = Math.trunc(this.y);
        this.z = Math.trunc(this.z);

        return this;
    }

    ceil() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        this.z = Math.ceil(this.z);

        return this;
    }

    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.z = Math.round(this.z);

        return this;
    }

    fround() {
        this.x = Math.fround(this.x);
        this.y = Math.fround(this.y);
        this.z = Math.fround(this.z);

        return this;
    }

    abs() {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        this.z = Math.abs(this.z);

        return this;
    }

    sign() {
        this.x = Math.sign(this.x);
        this.y = Math.sign(this.y);
        this.z = Math.sign(this.z);

        return this;
    }

    volumeRect() {
        return this.x * this.y * this.z;
    }

    length2() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    length() {
        return Math.sqrt(this.length2());
    }

    distance2To(v: Vector3) {
        return this.clone().minus(v).length2();
    }

    distanceTo(v: Vector3) {
        return this.clone().minus(v).length();
    }

    multiply(v: Vector3) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;

        return this;
    }

    multiplyN(n: number) {
        this.x *= n;
        this.y *= n;
        this.z *= n;

        return this;
    }

    multiplyX(n: number) {
        this.x *= n;
        return this;
    }
    multiplyY(n: number) {
        this.y *= n;
        return this;
    }
    multiplyZ(n: number) {
        this.z *= n;
        return this;
    }

    divide(v: Vector3) {
        this.x /= v.x;
        this.y /= v.y;
        this.z /= v.z;

        return this;
    }

    divideN(n: number) {
        this.x /= n;
        this.y /= n;
        this.z /= n;

        return this;
    }

    normalize(r = 1) {
        return this.multiplyN(r / (this.length() || 1));
    }

    plus(v: Vector3) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;

        return this;
    }

    plusN(x = 0, y = 0, z = 0) {
        this.x += x;
        this.y += y;
        this.z += z;

        return this;
    }

    minus(v: Vector3) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;

        return this;
    }

    minusN(x = 0, y = 0, z = 0) {
        this.x -= x;
        this.y -= y;
        this.z -= z;

        return this;
    }

    sphereNormalGetUV() {
        return new Vector2(
            0.5 + Math.atan2(this.z, this.x) / (2 * Math.PI),
            Math.atan2(Math.sqrt(this.x*this.x + this.z*this.z), this.y) / Math.PI,
        );
    }

    rotateX(ax: number) {
        const cosx = Math.cos(ax), sinx = Math.sin(ax);
        const { y, z } = this;

        this.y = y * cosx - z * sinx;
        this.z = y * sinx + z * cosx;

        return this;
    }

    rotateY(ay: number) {
        const cosy = Math.cos(ay), siny = Math.sin(ay);
        const { x, z } = this;

        this.x = x * cosy + z * siny;
        this.z = -x * siny + z * cosy;

        return this;
    }

    rotateZ(az: number) {
        const cosz = Math.cos(az), sinz = Math.sin(az);
        const { x, y } = this;

        this.x = x * cosz - y * sinz;
        this.y = x * sinz + y * cosz;

        return this;
    }

    rotateXYZ(as: Vector3) {
        return this.rotateX(as.x).rotateY(as.y).rotateZ(as.z);
    }

    rotateZYX(as: Vector3) {
        return this.rotateZ(as.z).rotateY(as.y).rotateX(as.x);
    }

    rotateZXY(as: Vector3) {
        return this.rotateZ(as.z).rotateX(as.x).rotateY(as.y);
    }

    rotateReverseXYZ(as: Vector3) {
        return this.rotateX(-as.x).rotateY(-as.y).rotateZ(-as.z);
    }

    rotateReverseZYX(as: Vector3) {
        return this.rotateZ(-as.z).rotateY(-as.y).rotateX(-as.x);
    }

    rotateReverseYXZ(as: Vector3) {
        return this.rotateY(-as.y).rotateX(-as.x).rotateZ(-as.z);
    }

    rotate(as: Vector3, order: ('X' | 'Y' | 'Z')[], dir = 1) {
        for (const a of order) {
            // this[`rotate${a}`](as[a.toLowerCase()]);
            if (a === 'X') this.rotateX(dir * as.x); else
            if (a === 'Y') this.rotateY(dir * as.y); else
            if (a === 'Z') this.rotateZ(dir * as.z);
        }

        return this;
    }

    normalizeAngles() {
        this.x %= 2 * Math.PI;
        this.y %= 2 * Math.PI;
        this.z %= 2 * Math.PI;

        return this;
    }

    // Y
    angles() {
        return new Vector2(
            Math.atan2(this.z, this.x),
            Math.atan2(Math.sqrt(this.x * this.x + this.z * this.z), this.y),
        );
    }

    // TODO
    anglesZ() {
        const a = this.angles();
        const { x, y } = a;
        a.x = y - Math.PI / 2;
        a.y = x - Math.PI / 2;
        return a;
    }

    angleBetween(v: Vector3) {
        return Math.acos(this.clone().normalize().dot(v.clone().normalize()));
    }

    sinAbsBetween(v: Vector3) {
        const cos = this.cosBetween(v);
        return Math.sqrt(1 - cos * cos);
    }

    cosBetween(v: Vector3) {
        return this.clone().normalize().dot(v.clone().normalize());
    }

    dot(v: Vector3) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    // right hand
    cross(v: Vector3) {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x,
        );
    }

    reflectByPlaneNormal(normal: Vector3) {
        return this.minus(normal.clone().multiplyN(2 * this.dot(normal)));
    }

    getDirectionTo(p: Vector3) {
        return p.clone().minus(this).normalize();
    }

    getRayToPoint(p: Vector3) {
        return new Ray3(this, this.getDirectionTo(p));
    }

    toRGB(multiplier = 255) {
        return `rgb(${multiplier * this.x}, ${multiplier * this.y}, ${multiplier * this.z})`;
    }
}

export class Vector3Shell<
    T extends any,
    ValidProps extends keyof T = keyof T
    /* , ValidProps extends KeysMatching<T, number> = KeysMatching<T, number> */
> extends Vector3 {
    constructor(
        private readonly _target: T,
        private readonly _xprop: ValidProps,
        private readonly _yprop: ValidProps,
        private readonly _zprop: ValidProps,
    ) {
        // @ts-ignore
        super(_target[_xprop], _target[_yprop], _target[_zprop]);
    }

    // @ts-ignore
    get x() { return this._target?.[this._xprop]; }
    // @ts-ignore
    set x(v) { if (this._target) this._target[this._xprop] = v; }

    // @ts-ignore
    get y() { return this._target?.[this._yprop]; }
    // @ts-ignore
    set y(v) { if (this._target) this._target[this._yprop] = v; }

    // @ts-ignore
    get z() { return this._target?.[this._zprop]; }
    // @ts-ignore
    set z(v) { if (this._target) this._target[this._zprop] = v; }
}

Vector3.Shell = Vector3Shell;

globalThis['Vector3'] = Vector3;

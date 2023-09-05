import { Helpers } from "../../helpers/common";
import { Vector2, type Vector2Shell } from "./Vector2";
import { Vector3, Vector3Shell } from "./Vector3";

export class Vector4 {
    static createRandom(max = 1, min = 0) {
        return new Vector4(
            Helpers.rand(max, min),
            Helpers.rand(max, min),
            Helpers.rand(max, min),
            Helpers.rand(max, min),
        );
    }

    static createColor(r = 0, g = 0, b = 0, opacity = 1) {
        return new Vector4(
            Math.pow(r, 1 / 2.2),
            Math.pow(g, 1 / 2.2),
            Math.pow(b, 1 / 2.2),
            opacity,
        );
    }

    static createFromPixelUI8(r = 0, g = 0, b = 0, opacity = 255) {
        return new Vector4(
            r / 255,
            g / 255,
            b / 255,
            opacity / 255,
        );
    }

    constructor(public x = 0, public y = 0, public z = 0, public w = 0) { }

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

    private _xw?: Vector2Shell<this>;
    get xw() { return (this._xw ??= new Vector2.Shell(this, 'x', 'w')); }
    private _yw?: Vector2Shell<this>;
    get yw() { return (this._yw ??= new Vector2.Shell(this, 'y', 'w')); }
    private _zw?: Vector2Shell<this>;
    get zw() { return (this._zw ??= new Vector2.Shell(this, 'z', 'w')); }
    private _wx?: Vector2Shell<this>;
    get wx() { return (this._wx ??= new Vector2.Shell(this, 'w', 'x')); }
    private _wy?: Vector2Shell<this>;
    get wy() { return (this._wy ??= new Vector2.Shell(this, 'w', 'y')); }
    private _wz?: Vector2Shell<this>;
    get wz() { return (this._wz ??= new Vector2.Shell(this, 'w', 'z')); }

    private _xyz?: Vector3Shell<this>;
    get xyz() { return (this._xyz ??= new Vector3.Shell(this, 'x', 'y', 'z')); }
    // TODO
    //#endregion ACCESSORS

    getArray() {
        return <[number, number, number, number]>[this.x, this.y, this.z, this.w];
    }

    getNormBytes(max = 1.0) {
        return new Uint8Array([
            this.x / max * 255,
            this.y / max * 255,
            this.z / max * 255,
            this.w / max * 255,
        ]);
    }

    getNormFloats(max = 1.0) {
        return new Float32Array([
            this.x / max,
            this.y / max,
            this.z / max,
            this.w / max,
        ]);
    }

    clone() {
        return new Vector4(this.x, this.y, this.z, this.w);
    }

    getXYZ() {
        return new Vector3(this.x, this.y, this.z);
    }

    isEquals(v: Vector4) {
        return this.x === v.x && this.y === v.y && this.z === v.z && this.z === v.w;
    }

    isEqualsN(x = this.x, y = this.y, z = this.z, w = this.w) {
        return (this.x === x) && (this.y === y) && (this.z === z) && (this.w === w);
    }

    set(v: Vector4) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        this.w = v.w;

        return this;
    }

    setN(x = this.x, y = this.y, z = this.z, w = this.w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;

        return this;
    }

    length2() {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }

    length() {
        return Math.sqrt(this.length2());
    }

    multiplyN(n: number) {
        this.x *= n;
        this.y *= n;
        this.z *= n;
        this.w *= n;

        return this;
    }

    divideN(n: number) {
        this.x /= n;
        this.y /= n;
        this.z /= n;
        this.w /= n;

        return this;
    }

    normalize(r = 1) {
        return this.multiplyN(r / (this.length() || 1));
    }

    plus(v: Vector4) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        this.w += v.w;

        return this;
    }

    plusN(x = 0, y = 0, z = 0, w = 0) {
        this.x += x;
        this.y += y;
        this.z += z;
        this.w += w;

        return this;
    }
}

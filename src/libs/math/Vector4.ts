import { Helpers } from "../../helpers/common";
import { Vector3 } from "./Vector3";

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

    toRGB(multiplier = 255) {
        return `rgb(${multiplier * this.x}, ${multiplier * this.y}, ${multiplier * this.z})`;
    }

    toRGBA(multiplier = 255) {
        return `rgb(${multiplier * this.x}, ${multiplier * this.y}, ${multiplier * this.z}, ${this.w})`;
    }
}

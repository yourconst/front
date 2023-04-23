import { Helpers } from "../../helpers/common";

export class Vector3 {
    static createRandom(max = 1, min = 0) {
        return new Vector3(
            Helpers.rand(max, min),
            Helpers.rand(max, min),
            Helpers.rand(max, min),
        );
    }

    static createColor(r = 0, g = 0, b = 0) {
        return new Vector3(
            Math.pow(r, 1 / 2.2),
            Math.pow(g, 1 / 2.2),
            Math.pow(b, 1 / 2.2),
        );
    }

    constructor(public x = 0, public y = 0, public z = 0) { }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    putToArray(array: ArrayBufferView | Array<number>, offset = 0) {
        array[offset + 0] = this.x;
        array[offset + 1] = this.y;
        array[offset + 2] = this.z;

        return offset + 3;
    }

    set(v: Vector3) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;

        return this;
    }

    setN(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    }

    length2() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    length() {
        return Math.sqrt(this.length2());
    }

    multiplyN(n: number) {
        this.x *= n;
        this.y *= n;
        this.z *= n;

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

    rotateByAngles(xz: number, yz: number) {
        let { x, y, z } = this;
        const cosxz = Math.cos(xz), sinxz = Math.sin(xz);

        this.x = x * cosxz - z * sinxz;
        this.z = x * sinxz + z * cosxz;

        z = this.z;

        const cosyz = Math.cos(yz), sinyz = Math.sin(yz);

        this.y = y * cosyz - z * sinyz;
        this.z = y * sinyz + z * cosyz;

        return this;
    }
}

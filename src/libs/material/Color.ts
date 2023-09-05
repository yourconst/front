import type { Vector3 } from "../math/Vector3";
import { Vector4 } from "../math/Vector4";

export class Color {
    static create(r: number, g = r, b = r, a?: number) {
        return new Color(new Vector4(r, g, b, a ?? 1));
    }

    static createFromBytes(r: number, g = r, b = r, a?: number) {
        return new Color(new Vector4(r/255, g/255, b/255, a ?? 1));
    }

    static toByteClampedArray(data: Array<Color>) {
        const result = new Uint8ClampedArray(data.length * 4);

        for (let i = 0; i < data.length; ++i) {
            result[4 * i + 0] = 255 * data[i].r;
            result[4 * i + 1] = 255 * data[i].g;
            result[4 * i + 2] = 255 * data[i].b;
            result[4 * i + 3] = 255 * data[i].a;
        }

        return result;
    }

    static toFloatArray(data: Array<Color>) {
        const result = new Float32Array(data.length * 4);

        for (let i = 0; i < data.length; ++i) {
            result[4 * i + 0] = data[i].r;
            result[4 * i + 1] = data[i].g;
            result[4 * i + 2] = data[i].b;
            result[4 * i + 3] = data[i].a;
        }

        return result;
    }

    // TODO
    // static createByString(color: string)

    constructor(readonly rgba = new Vector4) { }
    
    clone() {
        return new Color(this.rgba.clone());
    }

    get rgb() { return <Vector3> this.rgba.xyz; }

    get r() { return this.rgba.x; }
    set r(v) { this.rgba.x = v; }
    get g() { return this.rgba.y; }
    set g(v) { this.rgba.y = v; }
    get b() { return this.rgba.z; }
    set b(v) { this.rgba.z = v; }
    get a() { return this.rgba.w; }
    set a(v) { this.rgba.w = v; }

    getArray() {
        return this.rgba.getArray();
    }

    toRGB() {
        return `rgb(${255 * this.rgba.x},${255 * this.rgba.y},${255 * this.rgba.z})`;
    }

    toRGBA() {
        return `rgba(${255 * this.rgba.x},${255 * this.rgba.y},${255 * this.rgba.z},${this.rgba.w})`;
    }
}

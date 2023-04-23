import type { Vector3 } from "../math/Vector3";

export class Sphere {
    constructor(public center: Vector3, public radius: number, public color: Vector3) { }

    putToArray(array: ArrayBufferView | Array<number>, offset = 0) {
        this.center.putToArray(array, offset);
        array[offset + 3] = this.radius;
        this.color.putToArray(array, offset + 4);

        return offset + 7;
    }
}

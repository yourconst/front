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

    constructor(public x = 0, public y = 0) { }

    clone() {
        return new Vector2(this.x, this.y);
    }

    isEquals(v: Vector2) {
        return this.x === v.x && this.y === v.y;
    }

    isEqualsN(x: number, y: number) {
        return this.x === x && this.y === y;
    }

    putToArray(array: ArrayBufferView | Array<number>, offset = 0) {
        array[offset + 0] = this.x;
        array[offset + 1] = this.y;

        return offset + 2;
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

    plus(v: Vector2) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    multiplyN(n: number) {
        this.x *= n;
        this.y *= n;

        return this;
    }

    rotateByAngle(a = 0) {
        const { x, y } = this;
        const cos = Math.cos(a), sin = Math.sin(a);

        this.x = x * cos - y * sin;
        this.y = x * sin + y * cos;

        return this;
    }
}

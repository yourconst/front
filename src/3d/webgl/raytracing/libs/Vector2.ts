export class Vector2 {
    static fromAngle(a = 0, r = 1) {
        return new Vector2(Math.cos(a) * r, Math.sin(a) * r);
    }

    constructor(public x = 0, public y = 0) { }

    set(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        return this;
    }

    clone() {
        return new Vector2(this.x, this.y);
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

    rotateAngle(a = 0) {
        const { x, y } = this;
        const cos = Math.cos(a), sin = Math.sin(a);

        this.x = x * cos - y * sin;
        this.y = x * sin + y * cos;

        return this;
    }
}

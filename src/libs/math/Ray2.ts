import type { Vector2 } from "./Vector2";

export class Ray2 {
    constructor(public origin: Vector2, public direction: Vector2) { }

    setDirXIfNull(x = 1) {
        this.direction.setXIfNull(x);
        return this;
    }

    getPointByDistance(distance: number) {
        return this.direction.clone().multiplyN(distance).plus(this.origin);
    }
}

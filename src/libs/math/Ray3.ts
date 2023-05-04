import type { Vector3 } from "./Vector3";

export class Ray3 {
    constructor(public origin: Vector3, public direction: Vector3) { }

    setDirXIfNull(x = 1) {
        this.direction.setXIfNull(x);
        return this;
    }

    getPointByDistance(distance: number) {
        return this.direction.clone().multiplyN(distance).plus(this.origin);
    }
}

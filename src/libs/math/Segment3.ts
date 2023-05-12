import type { Ray3 } from "./Ray3";
import type { Vector3 } from "./Vector3";

export class Segment3 {
    createByRay(ray: Ray3, distance = 1) {
        return new Segment3(ray.origin, ray.getPointByDistance(distance));
    }

    constructor(public p0: Vector3, public p1: Vector3) { }
    
    length() {
        return this.p0.distanceTo(this.p1);
    }

    getRay() {
        return this.p0.getRayToPoint(this.p1);
    }
}

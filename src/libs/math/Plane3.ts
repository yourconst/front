import { Matrix3x3 } from "./Matrix3x3";
import type { Ray3 } from "./Ray3";
import type { Segment3 } from "./Segment3";
import type { Vector3 } from "./Vector3";
import type { IRotation3 } from "./rotattion/IRotation3";

export class Plane3 {
    createByRay(ray: Ray3, rotation: IRotation3) {
        return new Plane3(ray.origin, ray.direction, rotation);
    }

    constructor(public center: Vector3, public normal: Vector3, public rotation: IRotation3) { }

    clone() {
        return new Plane3(this.center.clone(), this.normal.clone(), this.rotation.clone());
    }

    getPointDeviation(p: Vector3) {
        return p.clone().minus(this.center).dot(this.normal)/*  / (this.normal.length() || 1) */;
    }

    getPointDistance(p: Vector3) {
        return Math.abs(this.getPointDeviation(p));
    }

    getClosestPointToPoint(p: Vector3) {
        const dev = this.getPointDeviation(p);

        if (dev < 0) {
            return p.clone();
        }

        return this.normal.clone().multiplyN(-dev).plus(p);
    }

    getClosestSurfacePointToPoint(p: Vector3) {
        const dev = this.getPointDeviation(p);
        return this.normal.clone().multiplyN(-dev).plus(p);
    }

    getNormalToPoint(p: Vector3) {
        return this.normal.clone();
    }

    getRayDistance(r: Ray3) {
        const dev = this.getPointDeviation(r.origin);
        const cos = this.normal.dot(r.direction);
        const d = -dev / cos;

        return d < 0 ? Infinity : d;
    }

    tryGetRayIntersectionPoint(r: Ray3) {
        const d = this.getRayDistance(r);

        if (d === Infinity) {
            return null;
        }

        return r.getPointByDistance(d);
    }

    tryGetSegmentIntersectionPoint(s: Segment3) {
        const r = s.getRay();
        const d = this.getRayDistance(r);

        if (s.length() < d) {
            return null;
        }

        return r.getPointByDistance(d);
    }

    // z - distance
    getRelativePosition(p: Vector3) {
        const cp = p.clone().minus(this.center);
        // const as = this.normal.anglesZ();

        // return cp
        //     .rotateY(-as.y)
        //     .rotateX(-as.x)
        //     .rotateZ(this.rotationZ);

        return this.rotation.getRelativeVector(cp);
    }
}

globalThis['Plane3'] = Plane3;

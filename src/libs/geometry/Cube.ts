import { AABB3 } from "../math/AABB3";
import { Vector2 } from "../math/Vector2";
import { Vector3 } from "../math/Vector3";
import { Geometry3 } from "./Geometry3";
import type { Ray3 } from "../math/Ray3";

export interface CubeOptions {
    center: Vector3;
    radius: number;
    angles?: Vector3;
}

export class Cube extends Geometry3 {
    constructor(options: CubeOptions) {
        super(options.center, options.radius, options.angles);
    }

    _getCloneConfig() {
        return {
            center: this.center.clone(),
            radius: this.radius,
            angles: this.angles.clone(),
        };
    }

    clone() {
        return new Cube(this._getCloneConfig());
    }

    calcAABB() {
        const r = this.radius;
        const ps = [
            this.center.clone().plusN(-r, -r, -r).rotateXYZ(this.angles),
            this.center.clone().plusN(-r, -r, r).rotateXYZ(this.angles),
            this.center.clone().plusN(r, -r, -r).rotateXYZ(this.angles),
            this.center.clone().plusN(r, -r, r).rotateXYZ(this.angles),
            this.center.clone().plusN(-r, r, -r).rotateXYZ(this.angles),
            this.center.clone().plusN(-r, r, r).rotateXYZ(this.angles),
            this.center.clone().plusN(r, r, -r).rotateXYZ(this.angles),
            this.center.clone().plusN(r, r, r).rotateXYZ(this.angles),
        ];

        if (!this.aabb) {
            return AABB3.createByPoints(ps);
        }
        return this.aabb.clear().updateByPoints(ps);
    }

    calcVolume() {
        return (this.radius * 2) ** 3;
    }

    getClosestPointToPoint(point: Vector3) {
        const t = point.clone().minus(this.center)
            .rotateZYX(this.angles.clone().multiplyN(-1));
        const at = t.clone().abs();

        if (
            at.x <= this.radius &&
            at.y <= this.radius &&
            at.z <= this.radius
        ) {
            return point.clone();
        }

        at.minSetN(this.radius, this.radius, this.radius);
        t.sign().setXIfNull();
        
        if (at.y < at.x && at.z < at.x) {
            at.x = this.radius;
        } else
        if (at.z < at.y) {
            at.y = this.radius;
        } else {
            at.z = this.radius;
        }

        return at.multiply(t).rotateXYZ(this.angles).plus(this.center);
    }

    getClosestSurfacePointToPoint(point: Vector3) {
        const t = point.clone().minus(this.center)
            .rotateZYX(this.angles.clone().multiplyN(-1));
        const at = t.clone().abs().minSetN(this.radius, this.radius, this.radius);
        t.sign().setXIfNull();
        
        if (at.y < at.x && at.z < at.x) {
            at.x = this.radius;
        } else
        if (at.z < at.y) {
            at.y = this.radius;
        } else {
            at.z = this.radius;
        }

        return at.multiply(t).rotateXYZ(this.angles).plus(this.center);
        
    }

    getRayDistance(ray: Ray3) {
        // const rAngles = this.angles.clone().multiplyN(-1);
        // const to = this.center.clone().minus(ray.origin).rotateZYX(rAngles);
        // const direction = ray.direction.clone().rotateZYX(rAngles);

        const rrr = this.getRelativeRay(ray);
        
        const rv = new Vector3(this.radius, this.radius, this.radius);

        const tMin = rv.clone().multiplyN(-1).minus(rrr.origin).divide(rrr.direction);
        const tMax = rv.clone().multiplyN(+1).minus(rrr.origin).divide(rrr.direction);

        const t1 = tMin.clone().minSet(tMax);
        const t2 = tMin.clone().maxSet(tMax);

        const tNear = Math.max(t1.x, t1.y, t1.z);
        const tFar = Math.min(t2.x, t2.y, t2.z);

        if (tFar < 0) {
            return Infinity;
        }
    
        return tNear < tFar ? tNear : Infinity;
    }

    getNormalToPoint(p: Vector3) {
        const hitPoint = this.getRelativePoint(p);
        const epsilon = 0.0001;

        let result: Vector3;
    
        if(hitPoint.x < /* this.center.x */ - this.radius + epsilon) result = new Vector3(-1.0, 0.0, 0.0);
        else if(hitPoint.x > /* this.center.x */ + this.radius - epsilon) result = new Vector3(1.0, 0.0, 0.0);
        else if(hitPoint.y < /* this.center.y */ - this.radius + epsilon) result = new Vector3(0.0, -1.0, 0.0);
        else if(hitPoint.y > /* this.center.y */ + this.radius - epsilon) result = new Vector3(0.0, 1.0, 0.0);
        else if(hitPoint.z < /* this.center.z */ - this.radius + epsilon) result = new Vector3(0.0, 0.0, -1.0);
        else result = new Vector3(0.0, 0.0, 1.0);

        return this.getAbsoluteDirection(result);
    }
}

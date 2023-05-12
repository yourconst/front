import { AABB3 } from "../math/AABB3";
import { Vector3 } from "../math/Vector3";
import { Geometry3, type Geometry3Options } from "./Geometry3";
import type { Ray3 } from "../math/Ray3";

export interface CubeOptions extends Geometry3Options {
    sizes?: Vector3;
}

export class Cube extends Geometry3 {
    sizes: Vector3;

    constructor(options: CubeOptions) {
        super(options);

        this.sizes = options.sizes ?? new Vector3(options.radius, options.radius, options.radius);;
    }

    _getCloneConfig() {
        return {
            ...super._getCloneConfig(),
            sizes: this.sizes.clone(),
        };
    }

    clone() {
        return new Cube(this._getCloneConfig());
    }

    calcAABB() {
        const s = this.sizes;
        const ps = [
            this.getAbsolutePoint(new Vector3(-s.x, -s.y, -s.z)),
            this.getAbsolutePoint(new Vector3(-s.x, -s.y, s.z)),
            this.getAbsolutePoint(new Vector3( s.x, -s.y, -s.z)),
            this.getAbsolutePoint(new Vector3( s.x, -s.y, s.z)),
            this.getAbsolutePoint(new Vector3(-s.x,  s.y, -s.z)),
            this.getAbsolutePoint(new Vector3(-s.x,  s.y, s.z)),
            this.getAbsolutePoint(new Vector3( s.x,  s.y, -s.z)),
            this.getAbsolutePoint(new Vector3( s.x,  s.y, s.z)),
        ];

        if (!this.aabb) {
            return AABB3.createByPoints(ps);
        }
        return this.aabb.clear().updateByPoints(ps);
    }

    calcVolume() {
        return this.sizes.volumeRect() * 8;
    }

    calcRadius() {
        return this.sizes.maxComponent();
    }

    getClosestPointToPoint(point: Vector3) {
        const t = this.getRelativePoint(point);
        const at = t.clone().abs();

        if (
            at.x <= this.sizes.x &&
            at.y <= this.sizes.y &&
            at.z <= this.sizes.z
        ) {
            return point.clone();
        }

        at.minSet(this.sizes);
        t.sign()/* .setXIfNull() */;
        
        // if (at.y < at.x && at.z < at.x) {
        //     at.x = this.sizes.x;
        // } else
        // if (at.z < at.y) {
        //     at.y = this.sizes.y;
        // } else {
        //     at.z = this.sizes.z;
        // }

        return this.getAbsolutePoint(at.multiply(t));
    }

    getClosestSurfacePointToPoint(point: Vector3) {
        const t = this.getRelativePoint(point);
        const at = t.clone().abs().minSet(this.sizes);
        t.sign().setXIfNull();
        const dt = this.sizes.clone().minus(at).multiplyN(-1);
        
        if (dt.y < dt.x && dt.z < dt.x) {
            at.x = this.sizes.x;
        } else
        if (dt.z < dt.y) {
            at.y = this.sizes.y;
        } else {
            at.z = this.sizes.z;
        }

        return this.getAbsolutePoint(at.multiply(t));
        
    }

    getRayDistance(ray: Ray3) {
        // const rAngles = this.angles.clone().multiplyN(-1);
        // const to = this.center.clone().minus(ray.origin).rotateZYX(rAngles);
        // const direction = ray.direction.clone().rotateZYX(rAngles);

        const rrr = this.getRelativeRay(ray);

        const tMin = this.sizes.clone().multiplyN(-1).minus(rrr.origin).divide(rrr.direction);
        const tMax = this.sizes.clone().multiplyN(+1).minus(rrr.origin).divide(rrr.direction);

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
        const rp = this.getRelativePoint(p);
        // const epsilon = this.radius * 0.1;
        const epsilon = 0.01;

        let result: Vector3;
        // console.log(this.radius, rp);
    
        if(rp.x < /* this.center.x */ - this.sizes.x + epsilon) result = new Vector3(-1.0, 0.0, 0.0);
        else if(rp.x > /* this.center.x */ + this.sizes.x - epsilon) result = new Vector3(1.0, 0.0, 0.0);
        else if(rp.y < /* this.center.y */ - this.sizes.y + epsilon) result = new Vector3(0.0, -1.0, 0.0);
        else if(rp.y > /* this.center.y */ + this.sizes.y - epsilon) result = new Vector3(0.0, 1.0, 0.0);
        else if(rp.z < /* this.center.z */ - this.sizes.z + epsilon) result = new Vector3(0.0, 0.0, -1.0);
        else result = new Vector3(0.0, 0.0, 1.0);

        // console.log(result);

        return this.getAbsoluteDirection(result);
    }
}

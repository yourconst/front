import { AABB3 } from "../math/AABB3";
import { Vector2 } from "../math/Vector2";
import type { Vector3 } from "../math/Vector3";
import { Geometry3, type Geometry3Options } from "./Geometry3";
import type { Ray3 } from "../math/Ray3";

export interface SphereOptions extends Geometry3Options {
    
}

export class Sphere extends Geometry3 {
    constructor(options: SphereOptions) {
        super(options);
    }

    clone() {
        return new Sphere(this._getCloneConfig());
    }

    calcAABB() {
        if (!this.aabb) {
            return AABB3.createByCenterRadius(this.center, this.radius);
        }
        return this.aabb.setByCenterRadius(this.center, this.radius);
    }

    calcVolume() {
        return 4 / 3 * Math.PI * (this.radius ** 3);
    }

    getRayDistance(ray: Ray3) {
        const toSphere = ray.origin.clone().minus(this.center);
    
        if (toSphere.length() < this.radius) {
            return 0.00001;
        }
    
        const a = ray.direction.dot(ray.direction);
        const b = 2.0 * toSphere.dot(ray.direction);
        const c = toSphere.dot(toSphere) - this.radius*this.radius;
        const discriminant = b*b - 4.0*a*c;
    
        if(discriminant > 0.0) {
            const t = (-b - Math.sqrt(discriminant)) / (2.0 * a);
            if(t > 0.0) return t;
        }
    
        return Infinity;
    }
}

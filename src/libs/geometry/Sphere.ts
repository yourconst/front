import { AABB3 } from "../math/AABB3";
import { Vector2 } from "../math/Vector2";
import type { Vector3 } from "../math/Vector3";
import { Geometry3 } from "./Geometry3";

export interface SphereOptions {
    center: Vector3;
    radius: number;
    angles?: Vector3;
}

export class Sphere extends Geometry3 {
    constructor(options: SphereOptions) {
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
        return new Sphere(this._getCloneConfig());
    }

    calcAABB() {
        if (!this.aabb) {
            return AABB3.createByCenterRadius(this.center, this.radius);
        }
        return this.aabb.updateByCenterRadius(this.center, this.radius);
    }

    calcVolume() {
        return 4 / 3 * Math.PI * (this.radius ** 3);
    }
}

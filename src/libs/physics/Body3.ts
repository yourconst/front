import type { Collision, Geometry3 } from "../geometry/Geometry3";
import { Vector3 } from "../math/Vector3";

export interface Body3Options {
    geometry: Geometry3;
    velocity?: Vector3;
    angleVelocity?: Vector3;
}

export class Body3 {
    geometry: Geometry3;
    velocity: Vector3;
    angleVelocity: Vector3;

    constructor(options: Body3Options) {
        this.geometry = options.geometry;

        this.velocity = options.velocity ?? new Vector3();
        this.angleVelocity = options.angleVelocity ?? new Vector3();
    }

    _getCloneConfig(cloneGeometry = true): Body3Options {
        return {
            geometry: cloneGeometry ? this.geometry.clone() : this.geometry,
            velocity: this.velocity.clone(),
            angleVelocity: this.angleVelocity.clone(),
        };
    }

    clone(cloneGeometry = true) {
        return new Body3(this._getCloneConfig(cloneGeometry));
    }

    onCollide(body: Body3, info: Collision) {
        return true;
    }

    getPointAngularVelocity(point: Vector3) {
        return point.clone().minus(this.geometry.center).cross(this.angleVelocity);
    }

    getPointVelocity(point: Vector3) {
        return this.getPointAngularVelocity(point).plus(this.velocity);
    }
}

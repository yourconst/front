import type { Geometry3 } from "../geometry/Geometry3";
import { Vector3 } from "../math/Vector3";

export interface RigidBody3Options {
    geometry: Geometry3;
    mass?: number;
    density?: number;
    velocity?: Vector3;
    acceleration?: Vector3;
    angleVelocity?: Vector3;
    angleAcceleration?: Vector3;
}

export class RigidBody3 {
    geometry: Geometry3;
    velocity: Vector3;
    acceleration: Vector3;
    angleVelocity: Vector3;
    angleAcceleration: Vector3;
    mass: number;
    density: number;

    constructor(options: RigidBody3Options) {
        this.geometry = options.geometry;
        this.velocity = options.velocity ?? new Vector3();
        this.acceleration = options.acceleration ?? new Vector3();
        this.angleVelocity = options.angleVelocity ?? new Vector3();
        this.angleAcceleration = options.angleAcceleration ?? new Vector3();

        if (options.mass) {
            this.mass = options.mass;
            this.density = this.calcDensity();
        } else {
            this.density = options.density ?? 1;
            this.mass = this.calcMass();
        }
    }

    calcMass() {
        return this.density * this.geometry.getVolume();
    }

    calcDensity() {
        return this.geometry.getVolume() / this.mass;
    }

    clone(cloneGeometry = true) {
        return new RigidBody3({
            geometry: cloneGeometry ? this.geometry.clone() : this.geometry,
            velocity: this.velocity.clone(),
            acceleration: this.acceleration.clone(),
            angleVelocity: this.angleVelocity.clone(),
            angleAcceleration: this.angleAcceleration.clone(),
            mass: this.mass,
            density: this.density,
        });
    }
}

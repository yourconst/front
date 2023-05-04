import type { Collision, Geometry3 } from "../geometry/Geometry3";
import { Vector3 } from "../math/Vector3";
import { Body3, type Body3Options } from "./Body3";

export interface RigidBody3Options extends Body3Options {
    mass?: number;
    density?: number;
    acceleration?: Vector3;
    forces?: Vector3;
    angleAcceleration?: Vector3;
    angleForces?: Vector3;
}

export class RigidBody3 extends Body3 {
    acceleration: Vector3;
    forces: Vector3;
    angleAcceleration: Vector3;
    angleForces: Vector3;
    mass: number;
    density: number;

    constructor(options: RigidBody3Options) {
        super(options);

        this.velocity = options.velocity ?? new Vector3();
        this.acceleration = options.acceleration ?? new Vector3();
        this.forces = options.forces ?? new Vector3();
        this.angleVelocity = options.angleVelocity ?? new Vector3();
        this.angleAcceleration = options.angleAcceleration ?? new Vector3();
        this.angleForces = options.angleForces ?? new Vector3();

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

    _getCloneConfig(cloneGeometry = true): RigidBody3Options {
        return {
            ...super._getCloneConfig(cloneGeometry),
            acceleration: this.acceleration.clone(),
            forces: this.forces.clone(),
            angleAcceleration: this.angleAcceleration.clone(),
            angleForces: this.angleForces.clone(),
            mass: this.mass,
            density: this.density,
        };
    }

    clone(cloneGeometry = true) {
        return new RigidBody3(this._getCloneConfig(cloneGeometry));
    }

    applyChanges(dt: number) {
        this.acceleration.plus(this.forces.multiplyN(1 / this.mass));
        this.forces.setN(0, 0, 0);
        this.geometry.center.plus(
            this.velocity.clone().multiplyN(dt).plus(
                this.acceleration.clone().multiplyN(dt * dt / 2),
            ),
        );
        this.velocity.plus(this.acceleration.clone().multiplyN(dt));
        this.acceleration.setN(0, 0, 0);

        this.angleAcceleration.plus(this.angleForces.multiplyN(1 / this.mass));
        this.angleForces.setN(0, 0, 0);
        this.geometry.angles.plus(
            this.angleVelocity.clone().multiplyN(dt).plus(
                this.angleAcceleration.clone().multiplyN(dt * dt / 2),
            ),
        );
        this.angleVelocity.plus(this.angleAcceleration.clone().multiplyN(dt));
        this.angleAcceleration.setN(0, 0, 0);
    }

    applyForceToPoint(force: Vector3, point: Vector3) {
        const rv = point.clone().minus(this.geometry.center);
        const rvl = rv.length() || 1;
        const rawCos = rv.normalize().dot(force.clone().normalize());
        const cos = Math.sign(rawCos) * Math.min(1, Math.abs(rawCos));
        const sin = Math.sqrt(1 - cos * cos);

        // TODO: check. (why sin / cos replaced)
        this.angleForces.plus(force.cross(rv).multiplyN(1.0 * cos / rvl));
        this.forces.plus(force.clone().multiplyN(sin));

        return this;
    }

    applyImpulseToPoint(impulse: Vector3, point: Vector3) {
        const rv = point.clone().minus(this.geometry.center);
        const rvl = rv.length() || 1;
        const rawCos = rv.normalize().dot(impulse.clone().normalize());
        const cos = /* Math.sign(rawCos) *  */Math.min(1, Math.abs(rawCos));
        const sin = Math.sqrt(1 - cos * cos);

        // TODO: check. (why sin / cos replaced)
        this.angleVelocity.plus(impulse.cross(rv).multiplyN(1.0 * cos / rvl));
        this.velocity.plus(impulse.clone().multiplyN(sin));

        return this;
    }
}

/* 
Otiginal:
https://stackoverflow.com/questions/9037174/glsl-rotation-with-a-rotation-vector

vec3 temp = cross(q.xyz, v) + q.w * v;
vec3 rotated = v + 2.0*cross(q.xyz, temp);

js:
const v = new Vector2(1, 0, 0);
const n = new Vector2(0, 1, 0);
const angle = Math.PI / 2;

const cos = Math.cos(angle / 2);
const sin = Math.sin(angle / 2);

const q = n.clone().multiplyN(sin);
const qw = cos;

const temp = q.clone().cross(v).plus(v.clone().multiplyN(qw));
const result = q.clone().cross(temp).multiplyN(2).plus(v);

result;
*/

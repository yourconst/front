import type { Collision, Geometry3 } from "../geometry/Geometry3";
import { Matrix3x3 } from "../math/Matrix3x3";
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

        const da = this.angleVelocity.clone().multiplyN(dt).plus(
            this.angleAcceleration.clone().multiplyN(dt * dt / 2),
        );
        // this.geometry.angles.plus(
        //     da/* .rotateReverseZYX(this.geometry.angles) */,
        // ).normalizeAngles();
        this.geometry.rotation
            .rotateAbsoluteX(-da.x).rotateAbsoluteY(-da.y).rotateAbsoluteZ(-da.z);
            // ['m'].multiply3x3Left(Matrix3x3.createRotationFromAnglesXYZ(da));

        this.angleVelocity.plus(this.angleAcceleration.clone().multiplyN(dt));
        this.angleAcceleration.setN(0, 0, 0);
    }

    // applyForceToPoint(force: Vector3, point: Vector3) {
    //     const rv = point.clone().minus(this.geometry.center);
    //     const rvl = rv.length() || 1;
    //     const rawCos = rv.normalize().dot(force.clone().normalize());
    //     const cos = Math.sign(rawCos) * Math.min(1, Math.abs(rawCos));
    //     const sin = Math.sqrt(1 - cos * cos);

    //     // TODO: check. (why sin / cos replaced)
    //     this.angleForces.plus(force.cross(rv).multiplyN(1.0 * cos / rvl));
    //     this.forces.plus(force.clone().multiplyN(sin));

    //     return this;
    // }

    applyForceToPoint(force: Vector3, point: Vector3) {
        const rv = point.clone().minus(this.geometry.center);
        const cos = -rv.normalize().dot(force.clone().normalize());

        this.angleForces.plus(force.cross(rv));
        this.forces.plus(force.clone().multiplyN(cos));

        return this;
    }

    applyImpulseToPoint(impulse: Vector3, point: Vector3) {
        // const cm = this.geometry.getAbsoluteDirection(new Vector3(0, -0.5, 0)).plus(this.geometry.center);
        const rv = point.clone().minus(/* cm */this.geometry.center);
        // const rvl = rv.length();

        // if (rvl === 0) {
        //     this.velocity.plus(impulse);
        //     return this;
        // }

        const cos = -rv.normalize().dot(impulse.clone().normalize());
        // const cos = - Math.sign(rawCos) * Math.min(1, Math.abs(rawCos));

        this.angleVelocity.plus(impulse.cross(rv));
        this.velocity.plus(impulse.clone().multiplyN(cos));

        return this;
    }
}

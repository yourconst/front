import { Vector3 } from "../math/Vector3";
import { RigidBody3 } from "./RigidBody3";

export class PhysicsEngine3 {
    readonly rigidBodies = new Set<RigidBody3>();
    public G = 6.67430e-11;

    addBodies(bodies: Iterable<RigidBody3>) {
        for (const body of bodies) {
            this.addBody(body);
        }

        return this;
    }

    addBody(body: RigidBody3) {
        if (body instanceof RigidBody3) {
            this.rigidBodies.add(body);
        }

        return this;
    }

    removeBody(body: RigidBody3) {
        if (body instanceof RigidBody3) {
            this.rigidBodies.delete(body);
        }

        return this;
    }

    clearBodies() {
        this.rigidBodies.clear();
    }

    makeSattellite(options: {
        centerBody: RigidBody3;
        satelliteBody: RigidBody3;
        distance?: number;
        k?: number;
    }) {
        const {
            centerBody: center, satelliteBody: satellite,
            distance = center.geometry.center
                .distanceTo(satellite.geometry.center) -
                center.geometry.radius - satellite.geometry.radius,
            k = 1.5,
        } = options;

        const vl = Math.pow(
            1.5 * this.G * (center.mass + satellite.mass) / (
                distance +
                center.geometry.radius +
                satellite.geometry.radius
            ),
            0.5,
        );
        
        const n = satellite.geometry.center.clone().minus(center.geometry.center).normalize();
        const rv = Vector3.createRandom(1e10, 0).normalize();
        const v = n.cross(rv).multiplyN(vl);

        satellite.geometry.center.set(
            n.multiplyN(distance + center.geometry.radius + satellite.geometry.radius)
                .plus(center.geometry.center),
        );
        satellite.velocity.set(center.velocity.clone().plus(v));

        return this;
    }

    calcStep(dt: number) {
        const bodies = [...this.rigidBodies];

        for (let i = 0; i < bodies.length; ++i) {
            const body1 = bodies[i];

            for (let j = i + 1; j < bodies.length; ++j) {
                const body2 = bodies[j];
                
                const rv = body1.geometry.getRadiusVectorByCentresTo(body2.geometry);
                let rl = rv.length() || 1;
                const rsum = body1.geometry.radius + body2.geometry.radius;

                if (rsum > rl) {
                    rl = Math.pow(rl, 0.5);
                    rv.normalize(-rl);
                }
                
                const f = rv.multiplyN(
                    this.G * body1.mass * body2.mass / (rl ** 3),
                );

                body1.acceleration.plus(f.clone().multiplyN(1/body1.mass));
                body2.acceleration.minus(f.clone().multiplyN(1 / body2.mass));

                continue;
                
                const collision = body1.geometry.getCollision(body2.geometry);

                if (!collision.isCollided) {
                    continue;
                }
                
                const msum = body1.mass + body2.mass;
                const b1part = body2.mass / msum;
                const b2part = body1.mass / msum;

                // const vpj1 = collision.normal.clone().dot(body1.velocity);
                // const vpj2 = collision.normal.clone().dot(body2.velocity);
                // const vpjsum = vpj1 + vpj2;

                // body1.velocity.plus(collision.normal.clone().multiplyN(vpjsum * b1part));
                // body2.velocity.minus(collision.normal.clone().multiplyN(vpjsum * b2part));

                // body1.geometry.center.plus(collision.normal.clone().multiplyN(-collision.depth * 0.5 * b1part));
                // body2.geometry.center.plus(collision.normal.clone().multiplyN(collision.depth * 0.5 * b2part));
            }
        }

        for (const body of bodies) {
            body.geometry.center.plus(
                body.velocity.clone().multiplyN(dt).plus(
                    body.acceleration.clone().multiplyN(dt * dt / 2),
                ),
            );
            body.velocity.plus(body.acceleration.clone().multiplyN(dt));
            body.acceleration.setN(0, 0, 0);

            body.geometry.angles.plus(
                body.angleVelocity.clone().multiplyN(dt).plus(
                    body.angleAcceleration.clone().multiplyN(dt * dt / 2),
                ),
            );
            body.angleVelocity.plus(body.angleAcceleration.clone().multiplyN(dt));
            body.angleAcceleration.setN(0, 0, 0);
        }
    }
}

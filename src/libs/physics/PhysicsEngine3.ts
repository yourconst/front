import type { Collision } from "../geometry/Geometry3";
import { Mapper3 } from "../geometry/Mapper3";
import { AABB3 } from "../math/AABB3";
import { Vector3 } from "../math/Vector3";
import { Body3 } from "./Body3";
import { RigidBody3 } from "./RigidBody3";

type AdditionalProps<Groups, Names> = {
    name?: Names;
    groups?: Set<Groups>;
    checkedSet?: Set<Body3>;
};

type Body<Groups, Names> = Body3 & AdditionalProps<Groups, Names>;
type RigidBody<Groups, Names> = RigidBody3 & AdditionalProps<Groups, Names>;

export class PhysicsEngine3<Groups = null, Names = null> {
    readonly staticMapper: Mapper3<Body<Groups, Names>>;
    readonly rigidMapper: Mapper3<RigidBody<Groups, Names>>;
    readonly groups = new Map<Groups, Map<Names, Body<Groups, Names>>>();
    readonly names = new Map<Names, Body<Groups, Names>>();

    public G = 6.67430e-11;

    // 1e10, 3e9
    constructor(options: {
        mapRadius: number;
        mapCellSize: number;
    }) {
        const s = options.mapCellSize;
        this.staticMapper = new Mapper3(AABB3.createByCenterRadius(new Vector3(), options.mapRadius), new Vector3(s, s, s));
        this.rigidMapper = new Mapper3(AABB3.createByCenterRadius(new Vector3(), options.mapRadius), new Vector3(s, s, s));
    }

    addBodies(bodies: Iterable<Body<Groups, Names>>) {
        for (const body of bodies) {
            this.addBody(body);
        }

        return this;
    }

    addBody(body: Body<Groups, Names>) {
        if (body instanceof RigidBody3) {
            this.rigidMapper.add(body);
        } else
        if (body instanceof Body3) {
            this.staticMapper.add(body);
        }

        body.checkedSet ??= new Set();

        return this;
    }

    addBodyByNameAndGroup(body: Body<Groups, Names>, name: Names, group?: Groups) {
        this.addBody(body);

        if (name) {
            body.name = name;
            this.names.set(body.name, body);
        }

        if (group) {
            body.groups ??= new Set();
            body.groups.add(group);
            let g = this.groups.get(group);
            if (!g) {
                g = new Map;
                this.groups.set(group, g);
            }
            g.set(body.name, body);
        }

        return this;
    }

    getBodyByName(name: Names) {
        return this.names.get(name);
    }

    getBodyByGroupAndName(group: Groups, name: Names) {
        return this.groups.get(group)?.get(name);
    }

    getBodiesByGroup(group: Groups) {
        return [...(this.groups.get(group)?.values() || [])];
    }

    removeBody(body: Body<Groups, Names>) {
        if (body instanceof RigidBody3) {
            this.rigidMapper.remove(body);
        } else
        if (body instanceof Body3) {
            this.staticMapper.remove(body);
        }

        this.names.delete(body.name);
        if (body.groups) {
            for (const group of body.groups) {
                this.groups.get(group)?.delete(body.name);
            }
        }

        return this;
    }

    removeBodyByName(name: Names) {
        const body = this.getBodyByName(name);
        if (body) {
            this.removeBody(body);
        }
        return this;
    }

    removeBodiesByGroup(group: Groups) {
        const bodies = this.getBodiesByGroup(group);

        if (bodies) {
            for (const body of bodies) {
                this.removeBody(body);
            }
        }
        return this;
    }

    clear() {
        this.names.clear();
        this.groups.clear();
        this.rigidMapper.clear();
        this.staticMapper.clear();
    }

    makeSatellite(options: {
        centerBody: RigidBody3;
        satelliteBody: RigidBody3;
        distance?: number;
        k?: number;
        orbitNormal?: Vector3;
    }) {
        const {
            centerBody: center, satelliteBody: satellite,
            distance = center.geometry.center
                .distanceTo(satellite.geometry.center) -
                center.geometry.radius - satellite.geometry.radius,
            k = 1.0,
            orbitNormal = new Vector3(0, 1, 0), // Vector3.createRandom(1e10, 0).normalize()
        } = options;

        const vl = Math.pow(
            k * this.G * (center.mass + satellite.mass) / (
                distance +
                center.geometry.radius +
                satellite.geometry.radius
            ),
            0.5,
        );
        
        const n = satellite.geometry.center.clone().minus(center.geometry.center).normalize();
        const v = n.cross(orbitNormal.clone().normalize()).multiplyN(vl);

        satellite.geometry.center.set(
            n.multiplyN(distance + center.geometry.radius + satellite.geometry.radius)
                .plus(center.geometry.center),
        );
        satellite.velocity.set(center.velocity.clone().plus(v));

        return this;
    }

    calcPairGravitation(body1: RigidBody3, body2: RigidBody3) {
        const rv = body1.geometry.getRadiusVectorByCentresTo(body2.geometry);
        const rl = rv.length() || 1;
        
        const f = rv.multiplyN(
            this.G * body1.mass * body2.mass / (rl ** 3),
        );

        body1.applyForceToPoint(f, body1.geometry.center);
        body2.applyForceToPoint(f.clone().multiplyN(-1), body2.geometry.center);

        // return this;
    }

    readonly rigidStaticCollisions: (Collision & {
        impulse: Vector3;
        bodys: Body3;
        bodyr: RigidBody3;
    })[] = [];

    calcRigidStaticCollision(bodyr: RigidBody3, bodys: Body3, info: Collision) {
        if (!bodyr.onCollide(bodys, info) || !bodys.onCollide(bodyr, info)) {
            return;
        }

        const pvr = bodyr.getPointVelocity(info.point);
        const pvs = bodys.getPointVelocity(info.point);

        const impulse = pvr.clone()
            .minus(pvs)
            // .reflectByPlaneNormal(info.normal)
            .multiplyN(0.2);
        
        this.rigidStaticCollisions.push({
            ...info,
            impulse,
            bodys,
            bodyr,
        });
        
        // console.log({
        //     pvs,
        //     pvr,
        //     normal: info.normal,
        //     velocity: bodyr.velocity.clone(),
        //     point: info.point,
        //     impulse,
        // });

        bodyr.applyImpulseToPoint(impulse, info.point);
        // bodyr.applyForceToPoint(
        //     bodyr.forces.clone().multiplyN(0.25 * bodyr.forces.dot(info.normal)),
        //     info.point,
        // );

        bodyr.geometry.center.plus(info.normal.clone().multiplyN(info.depth * 0.5));
    }

    calcPairCollision(body1: RigidBody3, body2: RigidBody3, info: Collision) {
        if (!body1.onCollide(body2, info) || !body2.onCollide(body1, info)) {
            return;
        }
        
        const msum = body1.mass + body2.mass;
        const b1part = body2.mass / msum;
        const b2part = body1.mass / msum;

        const impulse = body1.getPointVelocity(info.point)
            .minus(body2.getPointVelocity(info.point))
            .multiplyN(0.5);
        
        this.rigidStaticCollisions.push({
            ...info,
            impulse,
            bodys: body2,
            bodyr: body1,
        });

        body1.applyImpulseToPoint(impulse.clone().multiplyN(b1part), info.point);
        body2.applyImpulseToPoint(impulse.clone().multiplyN(-b2part), info.point);

        body1.geometry.center.plus(info.normal.clone().multiplyN(info.depth * 0.5 * b1part));
        body2.geometry.center.plus(info.normal.clone().multiplyN(-info.depth * 0.5 * b2part));
    }

    calcStep(dt: number, options: {
        gravitation?: 'rigids' | Vector3 | {
            center: Vector3;
            acceleration: number;
        };
    } = { gravitation: 'rigids' }) {
        this.rigidStaticCollisions.length = 0;
        const bodies = this.rigidMapper.getAll();

        const gravitationRigids = options.gravitation === 'rigids';
        const gravitationVector = options.gravitation instanceof Vector3 ? options.gravitation : null;
        const gravitationCenter = typeof options.gravitation === 'object' && 'center' in options.gravitation ? options.gravitation : null;

        for (let i = 0; i < bodies.length; ++i) {
            const body1 = bodies[i];

            if (gravitationRigids)
            for (let j = i + 1; j < bodies.length; ++j) {
                this.calcPairGravitation(body1, bodies[j]);
            }

            if (gravitationVector)
            body1.forces.plus(gravitationVector.clone().multiplyN(body1.mass));
            
            if (gravitationCenter) {
                const dir = gravitationCenter.center.clone().minus(body1.geometry.center).normalize();
                body1.forces.plus(dir.multiplyN(gravitationCenter.acceleration * body1.mass));
            }

            const statics = this.staticMapper.getCollidedWithInfo(body1);
            // statics.length && console.log(statics);

            for (const info of statics) {
                this.calcRigidStaticCollision(body1, info.object, info);
            }

            const rigids = this.rigidMapper.getCollidedWithInfo(body1);

            for (const info of rigids) {
                const body2 = info.object;

                if (/* body1.checkedSet.has(body2) ||  */body2.checkedSet.has(body1)) {
                    continue;
                }
                body1.checkedSet.add(body2);
                // body2.checkedSet.add(body1);
                
                this.calcPairCollision(body1, body2, info);
            }
        }

        for (const body of bodies) {
            body.applyChanges(dt);

            body.checkedSet.clear();
            this.rigidMapper.update(body);
        }

        const statics = this.staticMapper.getAll();

        for (const body of statics) {
            body.applyChanges(dt);
            this.staticMapper.update(body);
        }
    }
}

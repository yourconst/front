import type { AABB3 } from "../math/AABB3";
import type { Vector3 } from "../math/Vector3";
import { Ray3 } from "../math/Ray3";
import { Matrix3x3 } from "../math/Matrix3x3";
import type { IRotation3 } from "../math/rotattion/IRotation3";
import { Rotation3 } from "../math/rotattion/Rotation3";

// export interface Geometry3Options {
//     center: Vector3;
//     radius?: number;
//     aabb?: AABB3;
// }

export interface Collision {
    isCollided: boolean;
    depth?: number;
    point?: Vector3;
    normal?: Vector3;
}

export interface Geometry3Options {
    center: Vector3;
    radius?: number;
    volume?: number;
    aabb?: AABB3;
    rotation?: IRotation3;
}

export abstract class Geometry3 {
    center: Vector3;
    radius?: number;
    volume?: number;
    aabb?: AABB3;
    rotation: IRotation3;

    constructor(options: Geometry3Options) {
        this.center = options.center;
        this.radius = options.radius;
        this.volume = options.volume;
        this.aabb = options.aabb;
        this.rotation = options.rotation ?? Rotation3.Quaternion.createNXYZ(0, 0, 0);
    }

    _getCloneConfig(): Geometry3Options {
        return {
            center: this.center.clone(),
            radius: this.radius,
            volume: this.volume,
            aabb: this.aabb,
            rotation: this.rotation.clone(),
        };
    }

    abstract clone(): Geometry3;

    abstract getRayDistance(ray: Ray3): number;
    
    calcRadius() {
        return this.radius;
    };
    abstract calcAABB(): AABB3;
    abstract calcVolume(): number;

    getRadiusVectorByCentresTo(geometry: Geometry3) {
        return geometry.center.clone().minus(this.center);
    }

    getClosestPointToPoint(p: Vector3) {
        const to = p.clone().minus(this.center);
        const tol = to.length();

        if (tol < this.getRadius()) {
            return p.clone();
        }

        return to.multiplyN(this.getRadius() / tol).plus(this.center);
    }

    getClosestSurfacePointToPoint(p: Vector3) {
        const to = p.clone().minus(this.center).setXIfNull();
        let tol = to.length();

        return to.multiplyN(this.getRadius() / tol).plus(this.center);
    }

    getNormalToPoint(p: Vector3) {
        return p.clone().minus(this.center).normalize();
    }

    getSignedDistanceTo(geometry: Geometry3) {
        return this.center.distanceTo(geometry.center) - this.getRadius() - geometry.getRadius();
    }

    getCollisionPointInfo(geometry: Geometry3) {
        const depth = this.getSignedDistanceTo(geometry);

        if (depth > 0) {
            return {
                isCollided: false,
                depth,
            };
        }

        return {
            isCollided: true,
            depth,
            point: geometry.center.clone().minus(this.center)
                .normalize(this.getRadius() + depth / 2)
                .plus(this.center),
        };
    }

    getCollision(geometry: Geometry3): Collision {
        let mult = 1;
        let max: Geometry3 = this;
        let min: Geometry3 = geometry;

        if (max['sizes'] || max.getVolume() < min.getVolume()) {
            mult = -1;
            max = geometry;
            min = this;
        }

        const op = min.getClosestSurfacePointToPoint(max.center);
        const tp = max.getClosestSurfacePointToPoint(op);

        if (max.center.distance2To(tp) < max.center.distance2To(op)) {
            return {
                isCollided: false,
            };
        }

        const point = op.clone().plus(tp).multiplyN(0.5);
        return {
            isCollided: true,
            depth: op.distanceTo(tp),
            point,
            // normal: op.clone().minus(tp).normalize().multiplyN(mult),
            normal: max.getNormalToPoint(tp).multiplyN(-mult),
        };

        // const info = this.getCollisionPointInfo(geometry);

        // if (!info.isCollided) {
        //     return info;
        // }

        // return {
        //     ...info,
        //     normal: this.getNormalToPoint(info.point),
        // };
    }

    getRadius() {
        if (typeof this.radius !== 'number') {
            this.radius = this.calcRadius();
        }

        return this.radius;
    }
    recalcRadius() {
        this.radius = this.calcRadius();
        return this.radius;
    }
    
    getAABB() {
        if (!this.aabb) {
            this.aabb = this.calcAABB();
        }

        return this.aabb;
    }
    recalcAABB() {
        this.aabb = this.calcAABB();
        return this.aabb;
    }

    getVolume() {
        if (typeof this.volume !== 'number') {
            this.volume = this.calcVolume();
        }

        return this.volume;
    }
    recalcVolume() {
        this.volume = this.calcVolume();
        return this.volume;
    }



    getRelativeDirection(ad: Vector3) {
        // return ad.clone().rotateReverseZYX(this.angles);
        return this.rotation.getRelativeVector(ad);
    }

    getRelativePoint(ap: Vector3) {
        // return ap.clone()
        //     .minus(this.center)
        //     .rotateReverseZYX(this.angles);
        return this.getRelativeDirection(
            ap.clone().minus(this.center),
        );
    }

    getAbsoluteDirection(rd: Vector3) {
        // return rd.clone().rotateXYZ(this.angles);
        return this.rotation.getAbsoluteVector(rd);
    }

    getAbsolutePoint(rp: Vector3) {
        // return rp.clone()
        //     .rotateXYZ(this.angles)
        //     .plus(this.center);
        return this.getAbsoluteDirection(rp).plus(this.center);
    }

    getRelativeRay(ar: Ray3) {
        return new Ray3(
            this.getRelativePoint(ar.origin),
            this.getRelativeDirection(ar.direction),
        )
    }

    getAbsoluteRay(rr: Ray3) {
        return new Ray3(
            this.getAbsolutePoint(rr.origin),
            this.getAbsoluteDirection(rr.direction),
        )
    }
}

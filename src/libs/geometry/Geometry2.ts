import type { AABB2 } from "../math/AABB2";
import type { Vector2 } from "../math/Vector2";
import { Ray2 } from "../math/Ray2";
import type { IRotation2 } from "../math/rotattion/IRotation2";
import { Rotation2 } from "../math/rotattion/Rotation2";

export interface Collision2 {
    isCollided: boolean;
    depth?: number;
    point?: Vector2;
    normal?: Vector2;
}

export interface Geometry2Options {
    center: Vector2;
    radius?: number;
    square?: number;
    aabb?: AABB2;
    rotation?: IRotation2;
}

export abstract class Geometry2 {
    center: Vector2;
    radius?: number;
    square?: number;
    aabb?: AABB2;
    rotation: IRotation2;

    constructor(options: Geometry2Options) {
        this.center = options.center;
        this.radius = options.radius;
        this.square = options.square;
        this.aabb = options.aabb;
        this.rotation = options.rotation ?? Rotation2.Euler.create();
    }

    _getCloneConfig(): Geometry2Options {
        return {
            center: this.center.clone(),
            radius: this.radius,
            square: this.square,
            aabb: this.aabb,
            rotation: this.rotation.clone(),
        };
    }

    abstract clone(): Geometry2;

    abstract getRayDistance(ray: Ray2): number;
    
    calcRadius() {
        return this.radius;
    };
    abstract calcAABB(): AABB2;
    abstract calcSquare(): number;

    getRadiusVectorByCentresTo(geometry: Geometry2) {
        return geometry.center.clone().minus(this.center);
    }

    getClosestPointToPoint(p: Vector2) {
        const to = p.clone().minus(this.center);
        const tol = to.length();

        if (tol < this.getRadius()) {
            return p.clone();
        }

        return to.multiplyN(this.getRadius() / tol).plus(this.center);
    }

    getClosestSurfacePointToPoint(p: Vector2) {
        const to = p.clone().minus(this.center).setXIfNull();
        let tol = to.length();

        return to.multiplyN(this.getRadius() / tol).plus(this.center);
    }

    getNormalToPoint(p: Vector2) {
        return p.clone().minus(this.center).normalize();
    }

    getSignedDistanceTo(geometry: Geometry2) {
        return this.center.distanceTo(geometry.center) - this.getRadius() - geometry.getRadius();
    }

    getCollisionPointInfo(geometry: Geometry2) {
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

    getCollision(geometry: Geometry2): Collision2 {
        let mult = 1;
        let max: Geometry2 = this;
        let min: Geometry2 = geometry;

        if (max['sizes'] || max.getSquare() < min.getSquare()) {
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
            normal: max.getNormalToPoint(tp).multiplyN(-mult),
        };
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

    getSquare() {
        if (typeof this.square !== 'number') {
            this.square = this.calcSquare();
        }

        return this.square;
    }
    recalcSquare() {
        this.square = this.calcSquare();
        return this.square;
    }



    getRelativeDirection(ad: Vector2) {
        // return ad.clone().rotateReverseZYX(this.angles);
        return this.rotation.getRelativeVector(ad);
    }

    getRelativePoint(ap: Vector2) {
        // return ap.clone()
        //     .minus(this.center)
        //     .rotateReverseZYX(this.angles);
        return this.getRelativeDirection(
            ap.clone().minus(this.center),
        );
    }

    getAbsoluteDirection(rd: Vector2) {
        // return rd.clone().rotateXYZ(this.angles);
        return this.rotation.getAbsoluteVector(rd);
    }

    getAbsolutePoint(rp: Vector2) {
        // return rp.clone()
        //     .rotateXYZ(this.angles)
        //     .plus(this.center);
        return this.getAbsoluteDirection(rp).plus(this.center);
    }

    getRelativeRay(ar: Ray2) {
        return new Ray2(
            this.getRelativePoint(ar.origin),
            this.getRelativeDirection(ar.direction),
        )
    }

    getAbsoluteRay(rr: Ray2) {
        return new Ray2(
            this.getAbsolutePoint(rr.origin),
            this.getAbsoluteDirection(rr.direction),
        )
    }
}

import type { AABB3 } from "../math/AABB3";
import { Vector3 } from "../math/Vector3";

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

export abstract class Geometry3 {
    constructor(
        public center = new Vector3(),
        public radius?: number,
        public angles = new Vector3(),
        public aabb?: AABB3,
        public volume?: number,
    ) { }

    abstract clone(): Geometry3;
    
    calcRadius() {
        return this.radius;
    };
    abstract calcAABB(): AABB3;
    abstract calcVolume(): number;

    getRadiusVectorByCentresTo(geometry: Geometry3) {
        return geometry.center.clone().minus(this.center);
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
        const info = this.getCollisionPointInfo(geometry);

        if (!info.isCollided) {
            return info;
        }

        return {
            ...info,
            normal: this.getNormalToPoint(info.point),
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
}

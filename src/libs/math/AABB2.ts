import { Range } from "./Range";
import type { Ray3 } from "./Ray3";
import { Vector2 } from "./Vector2";

export class AABB2 {
    static createByPoint(p: Vector2) {
        return new AABB2(p.clone(), p.clone());
    }

    static createByPoints(points: Vector2[]) {
        return new AABB2().updateByPoints(points);
    }

    static createByCenterRadius(center: Vector2, r: number) {
        return new AABB2(
            new Vector2(center.x - r, center.y - r),
            new Vector2(center.x + r, center.y + r),
        );
    }

    static createByCenterHalfSizes(center: Vector2, hs: Vector2) {
        return new AABB2(
            new Vector2(center.x - hs.x, center.y - hs.y),
            new Vector2(center.x + hs.x, center.y + hs.y),
        );
    }

    constructor(
        public min = new Vector2(Infinity, Infinity),
        public max = min?.clone() ?? new Vector2(-Infinity, -Infinity),
    ) { }

    clear() {
        this.min.setN(Infinity, Infinity);
        this.max.setN(-Infinity, -Infinity);
        return this;
    }
    
    clone() {
        return new AABB2(this.min.clone(), this.max.clone());
    }

    isValid() {
        return Range.isValid(this.min.x, this.max.x) &&
            Range.isValid(this.min.y, this.max.y);
    }

    getSize() {
        return new Vector2(
            this.max.x - this.min.x,
            this.max.y - this.min.y,
        );
    }

    isEquals(b: AABB2) {
        return this.min.isEquals(b.min) && this.max.isEquals(b.max);
    }

    checkUpdate() {
        this.min.minSet(this.max);
        this.max.maxSet(this.min);
        return this;
    }

    updateByAABB(aabb: AABB2) {
        this.min.minSet(aabb.min);
        this.max.maxSet(aabb.max);
        return this;
    }

    updateByPoint(point: Vector2) {
        this.min.minSet(point);
        this.max.maxSet(point);
        return this;
    }

    updateByPoints(points: Vector2[]) {
        for (const p of points) {
            this.updateByPoint(p);
        }
        return this;
    }

    updateByCenterRadius(center: Vector2, r: number) {
        this.min.minSetN(center.x - r, center.y - r);
        this.max.maxSetN(center.x + r, center.y + r);
        return this;
    }

    setByCenterRadius(center: Vector2, r: number) {
        this.min.setN(center.x - r, center.y - r);
        this.max.setN(center.x + r, center.y + r);
        return this;
    }

    isPointInside(point: Vector2) {
        return Range.isValueInside(point.x, this.min.x, this.max.x) &&
            Range.isValueInside(point.y, this.min.y, this.max.y);
    }

    isAABBCollided(aabb: AABB2) {
        return Range.isRangesCollided(this.min.x, this.max.x, aabb.min.x, aabb.max.x) &&
            Range.isRangesCollided(this.min.y, this.max.y, aabb.min.y, aabb.max.y);
    }

    _getCollisionAABB(aabb: AABB2) {
        const x = Range._getCollisionRange(this.min.x, this.max.x, aabb.min.x, aabb.max.x);
        const y = Range._getCollisionRange(this.min.y, this.max.y, aabb.min.y, aabb.max.y);

        return new AABB2(
            new Vector2(x.min, y.min),
            new Vector2(x.max, y.max),
        );
    }
    
    tryGetCollisionAABB(aabb: AABB2) {
        const x = Range._getCollisionRange(this.min.x, this.max.x, aabb.min.x, aabb.max.x);
        if (!x.isValid()) return null;
        const y = Range._getCollisionRange(this.min.y, this.max.y, aabb.min.y, aabb.max.y);
        if (!y.isValid()) return null;

        return new AABB2(
            new Vector2(x.min, y.min),
            new Vector2(x.max, y.max),
        );
    }

    getRayIntersections(r: Ray3) {
        const t0 = (this.min.x - r.origin.x) / r.direction.x;
        const t1 = (this.max.x - r.origin.x) / r.direction.x;
        const t2 = (this.min.y - r.origin.y) / r.direction.y;
        const t3 = (this.max.y - r.origin.y) / r.direction.y;

        const near = Math.max(Math.min(t0, t1), Math.min(t2, t3));
        const far = Math.min(Math.max(t0, t1), Math.max(t2, t3));

        const intersects = !(far < 0 || near > far);

        return {
            intersects,
            near: intersects ? Math.max(0, near) : Infinity,
            far,
        };
    }

    getRayDistance(r: Ray3) {
        return this.getRayIntersections(r).near;
    }
}

globalThis['AABB2'] = AABB2;

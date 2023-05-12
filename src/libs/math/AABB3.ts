import { Range } from "./Range";
import { Vector3 } from "./Vector3";

export class AABB3 {
    static createByPoint(p: Vector3) {
        return new AABB3(p.clone(), p.clone());
    }

    static createByPoints(points: Vector3[]) {
        return new AABB3().updateByPoints(points);
    }

    static createByCenterRadius(center: Vector3, r: number) {
        return new AABB3(
            new Vector3(center.x - r, center.y - r, center.z - r),
            new Vector3(center.x + r, center.y + r, center.z + r),
        );
    }

    static createByCenterHalfSizes(center: Vector3, hs: Vector3) {
        return new AABB3(
            new Vector3(center.x - hs.x, center.y - hs.y, center.z - hs.z),
            new Vector3(center.x + hs.x, center.y + hs.y, center.z + hs.z),
        );
    }

    constructor(
        public min = new Vector3(Infinity, Infinity, Infinity),
        public max = min?.clone() ?? new Vector3(-Infinity, -Infinity, -Infinity),
    ) { }

    clear() {
        this.min.setN(Infinity, Infinity, Infinity);
        this.max.setN(-Infinity, -Infinity, -Infinity);
        return this;
    }
    
    clone() {
        return new AABB3(this.min.clone(), this.max.clone());
    }

    isValid() {
        return Range.isValid(this.min.x, this.max.x) &&
            Range.isValid(this.min.y, this.max.y) &&
            Range.isValid(this.min.z, this.max.z);
    }

    getSize() {
        return new Vector3(
            this.max.x - this.min.x,
            this.max.y - this.min.y,
            this.max.z - this.min.z,
        );
    }

    isEquals(b: AABB3) {
        return this.min.isEquals(b.min) && this.max.isEquals(b.max);
    }

    checkUpdate() {
        this.min.minSet(this.max);
        this.max.maxSet(this.min);
        return this;
    }

    updateByAABB(aabb: AABB3) {
        this.min.minSet(aabb.min);
        this.max.maxSet(aabb.max);
        return this;
    }

    updateByPoint(point: Vector3) {
        this.min.minSet(point);
        this.max.maxSet(point);
        return this;
    }

    updateByPoints(points: Vector3[]) {
        for (const p of points) {
            this.updateByPoint(p);
        }
        return this;
    }

    updateByCenterRadius(center: Vector3, r: number) {
        this.min.minSetN(center.x - r, center.y - r, center.z - r);
        this.max.maxSetN(center.x + r, center.y + r, center.z + r);
        return this;
    }

    setByCenterRadius(center: Vector3, r: number) {
        this.min.setN(center.x - r, center.y - r, center.z - r);
        this.max.setN(center.x + r, center.y + r, center.z + r);
        return this;
    }

    isPointInside(point: Vector3) {
        return Range.isValueInside(point.x, this.min.x, this.max.x) &&
            Range.isValueInside(point.y, this.min.y, this.max.y) &&
            Range.isValueInside(point.z, this.min.z, this.max.z);
    }

    isAABBCollided(aabb: AABB3) {
        return Range.isRangesCollided(this.min.x, this.max.x, aabb.min.x, aabb.max.x) &&
            Range.isRangesCollided(this.min.y, this.max.y, aabb.min.y, aabb.max.y) &&
            Range.isRangesCollided(this.min.z, this.max.z, aabb.min.z, aabb.max.z);
    }

    _getCollisionAABB(aabb: AABB3) {
        const x = Range._getCollisionRange(this.min.x, this.max.x, aabb.min.x, aabb.max.x);
        const y = Range._getCollisionRange(this.min.y, this.max.y, aabb.min.y, aabb.max.y);
        const z = Range._getCollisionRange(this.min.z, this.max.z, aabb.min.z, aabb.max.z);

        return new AABB3(
            new Vector3(x.min, y.min, z.min),
            new Vector3(x.max, y.max, z.max),
        );
    }
    
    tryGetCollisionAABB(aabb: AABB3) {
        const x = Range._getCollisionRange(this.min.x, this.max.x, aabb.min.x, aabb.max.x);
        if (!x.isValid()) return null;
        const y = Range._getCollisionRange(this.min.y, this.max.y, aabb.min.y, aabb.max.y);
        if (!y.isValid()) return null;
        const z = Range._getCollisionRange(this.min.z, this.max.z, aabb.min.z, aabb.max.z);
        if (!z.isValid()) return null;

        return new AABB3(
            new Vector3(x.min, y.min, z.min),
            new Vector3(x.max, y.max, z.max),
        );
    }
}

globalThis['AABB3'] = AABB3;

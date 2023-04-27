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
        public start = new Vector3(Infinity, Infinity, Infinity),
        public end = start?.clone() ?? new Vector3(-Infinity, -Infinity, -Infinity),
    ) { }

    clear() {
        this.start.setN(Infinity, Infinity, Infinity);
        this.end.setN(-Infinity, -Infinity, -Infinity);
        return this;
    }
    
    clone() {
        return new AABB3(this.start.clone(), this.end.clone());
    }

    isValid() {
        return Range.isValid(this.start.x, this.end.x) &&
            Range.isValid(this.start.y, this.end.y) &&
            Range.isValid(this.start.z, this.end.z);
    }

    checkUpdate() {
        this.start.minSet(this.end);
        this.end.maxSet(this.start);
        return this;
    }

    updateByAABB(aabb: AABB3) {
        this.start.minSet(aabb.start);
        this.end.maxSet(aabb.end);
        return this;
    }

    updateByPoint(point: Vector3) {
        this.start.minSet(point);
        this.end.maxSet(point);
        return this;
    }

    updateByPoints(points: Vector3[]) {
        for (const p of points) {
            this.updateByPoint(p);
        }
        return this;
    }

    updateByCenterRadius(center: Vector3, r: number) {
        this.start.minSetN(center.x - r, center.y - r, center.z - r);
        this.start.maxSetN(center.x + r, center.y + r, center.z + r);
        return this;
    }

    isPointInside(point: Vector3) {
        return Range.isValueInside(point.x, this.start.x, this.end.x) &&
            Range.isValueInside(point.y, this.start.y, this.end.y) &&
            Range.isValueInside(point.z, this.start.z, this.end.z);
    }

    isAABBCollided(aabb: AABB3) {
        return Range.isRangesCollided(this.start.x, this.end.x, aabb.start.x, aabb.end.x) &&
            Range.isRangesCollided(this.start.y, this.end.y, aabb.start.y, aabb.end.y) &&
            Range.isRangesCollided(this.start.z, this.end.z, aabb.start.z, aabb.end.z);
    }

    _getCollisionAABB(aabb: AABB3) {
        const x = Range._getCollisionRange(this.start.x, this.end.x, aabb.start.x, aabb.end.x);
        const y = Range._getCollisionRange(this.start.y, this.end.y, aabb.start.y, aabb.end.y);
        const z = Range._getCollisionRange(this.start.z, this.end.z, aabb.start.z, aabb.end.z);

        return new AABB3(
            new Vector3(x.start, y.start, z.start),
            new Vector3(x.end, y.end, z.end),
        );
    }
    
    tryGetCollisionAABB(aabb: AABB3) {
        const x = Range._getCollisionRange(this.start.x, this.end.x, aabb.start.x, aabb.end.x);
        if (!x.isValid()) return null;
        const y = Range._getCollisionRange(this.start.y, this.end.y, aabb.start.y, aabb.end.y);
        if (!y.isValid()) return null;
        const z = Range._getCollisionRange(this.start.z, this.end.z, aabb.start.z, aabb.end.z);
        if (!z.isValid()) return null;

        return new AABB3(
            new Vector3(x.start, y.start, z.start),
            new Vector3(x.end, y.end, z.end),
        );
    }
}

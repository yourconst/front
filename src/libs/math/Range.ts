export class Range {
    static isValueInside(v: number, min: number, max: number) {
        return min <= v && v <= max;
    }

    static isRangesCollided(s1: number, e1: number, s2: number, e2: number) {
        return !(e1 < s2) || !(e2 < s1);
    }

    static isValid(min: number, max: number) {
        return min <= max;
    }

    static getClosestRangeValue(v: number, min: number, max: number) {
        return Math.max(min, Math.min(max, v));
    }

    static _getCollisionRange(s1: number, e1: number, s2: number, e2: number) {
        return new Range(
            Math.max(s1, s2),
            Math.min(e1, e2),
        );
    }

    static tryGetCollisionRange(s1: number, e1: number, s2: number, e2: number) {
        const result = new Range(
            Math.max(s1, s2),
            Math.min(e1, e2),
        );

        if (result.isValid()) {
            return result;
        }
        return null;
    }

    constructor(public min = Infinity, public max = -Infinity) { }

    clear() {
        this.min = Infinity;
        this.max = -Infinity;
        return this;
    }
    
    clone() {
        return new Range(this.min, this.max);
    }

    isValid() {
        return Range.isValid(this.min, this.max);
    }

    _getCollisionRange(r: Range) {
        return Range._getCollisionRange(this.min, this.max, r.min, r.max);
    }

    plus(v: number) {
        this.min -= v;
        this.max -= v;
        return this;
    }

    minus(v: number) {
        this.min -= v;
        this.max -= v;
        return this;
    }

    isValueInside(v: number) {
        return Range.isValueInside(v, this.min, this.max);
    }

    getClosestRangeValue(v: number) {
        return Math.max(this.min, Math.min(this.max, v));
    }

    isRangeCollided(r: Range) {
        return Range.isRangesCollided(this.min, this.max, r.min, r.max);
    }
}

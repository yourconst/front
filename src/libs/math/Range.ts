export class Range {
    static isValueInside(v: number, start: number, end: number) {
        return start <= v && v <= end;
    }

    static isRangesCollided(s1: number, e1: number, s2: number, e2: number) {
        return !(e1 < s2) || !(e2 < s1);
    }

    static isValid(start: number, end: number) {
        return start <= end;
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

    constructor(public start = Infinity, public end = -Infinity) { }

    clear() {
        this.start = Infinity;
        this.end = -Infinity;
        return this;
    }
    
    clone() {
        return new Range(this.start, this.end);
    }

    isValid() {
        return Range.isValid(this.start, this.end);
    }

    _getCollisionRange(r: Range) {
        return Range._getCollisionRange(this.start, this.end, r.start, r.end);
    }

    plus(v: number) {
        this.start -= v;
        this.end -= v;
        return this;
    }

    minus(v: number) {
        this.start -= v;
        this.end -= v;
        return this;
    }

    isValueInside(v: number) {
        return Range.isValueInside(v, this.start, this.end);
    }

    isRangeCollided(r: Range) {
        return Range.isRangesCollided(this.start, this.end, r.start, r.end);
    }
}

export interface LensOptions {
    f?: number;
    k?: number;
    kMin?: number;
    z?: number;
}

export class Lens {
    f: number;
    k: number;
    kMin: number;
    z: number;

    constructor(options?: LensOptions) {
        this.f = options?.f ?? 1;
        this.k = options?.k ?? 1;
        this.kMin = options?.k ?? 0.1;
        this.z = options?.z ?? 1; // 0.00003;
    }

    get d() { return this.f / this.k; }
    set d(v) { this.k = this.f / v; }

    get aperture() { return this.d * this.z; }

    _multDist = 1;
    get dist() { return this._multDist * this.f; }
    
    depthOfField2() {
        return this.f * this.f / (this.k * this.z) + this.dist;
    }

    _depthOfFieldClosest(r: number) {
        return r * this.f * this.f / (
            this.f * this.f - this.k * this.f * this.z + this.k * r * this.z
        );
    }

    _depthOfFieldFarest(r: number) {
        return r * this.f * this.f / (
            this.f * this.f + this.k * this.f * this.z - this.k * r * this.z
        );
    }

    _multRes = 1;
    calcBestD(distance: number) {
        // distance = Math.max(0, distance/*  - this.f * 0.5 */);
        // return this._multRes * this.f * this.f / (this.z * Math.max(0, distance - this.dist));
        return this._multRes * 1 / Math.abs(distance - this.f) / this.f / this.f;
    }
    
    _enabled = true;
    _movePart = 0.1;
    // k
    focusOn(distance: number, part = this._movePart) {
        if (!this._enabled) {
            return;
        }
        let { d } = this;

        if (!isFinite(d)) {
            d = 1e10;
        }

        const bestD = this.calcBestD(distance);

        this.d = d + part * (bestD - d);
    }
}

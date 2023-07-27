import { Joint3, type Joint3Options } from "./Joint3";

export interface Joint3SpringOptions extends Joint3Options {
    k?: number;
}

export class Joint3Spring extends Joint3 {
    k: number;

    constructor(options: Joint3SpringOptions) {
        super(options);
        this.k = options.k || (this.bindings.first.body.geometry.volume + this.bindings.second.body.geometry.volume);
    }

    update() {
        const points = this.getPoints();
        const rv = this.getRadiusVector(points);
        const rvl = rv.length();
        rv.normalize();

        const stretch = /* Math.min(1000,  */this.getStretch(rvl) * this.k * 10/* ) */;

        // console.log(points, rvl, this.k, stretch);
        
        this.bindings.first.body.applyForceToPoint(rv.clone().multiplyN(stretch), points.first);
        this.bindings.second.body.applyForceToPoint(rv.clone().multiplyN(-stretch), points.second);

        return this.isDestroyed(points);
    }
}

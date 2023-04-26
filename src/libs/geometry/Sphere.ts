import { Vector2 } from "../math/Vector2";
import type { Vector3 } from "../math/Vector3";

export interface SphereOptions {
    center: Vector3;
    radius: number;
    angles?: Vector2;
}

export class Sphere {
    public center: Vector3;
    public radius: number;
    public angles: Vector2;

    constructor(options: SphereOptions) {
        this.center = options.center;
        this.radius = options.radius;
        this.angles = options.angles || new Vector2();
    }
}

import type { Geometry3 } from "../geometry/Geometry3";
import { Sphere } from "../geometry/Sphere";
import { Vector3 } from "../math/Vector3";
import { RigidBody3, type RigidBody3Options } from "../physics/RigidBody3";

export interface Camera3Options {
    origin?: Vector3;
    angles?: Vector3;
    d?: number;
    distance?: number;
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export class Camera3 {
    static createWithBody(
        options: Camera3Options = {},
        bodyOptions: Optional<RigidBody3Options, 'geometry'> = {},
    ) {
        const camera = new Camera3({
            origin: bodyOptions.geometry?.center,
            ...options,
        });

        bodyOptions.geometry ??= new Sphere({
            center: camera.origin,
            radius: 1,
            angles: camera.angles,
        });

        return {
            camera,
            body: new RigidBody3(<RigidBody3Options> bodyOptions),
        };
    }

    origin: Vector3;
    angles: Vector3;
    d: number;
    distance: number;

    constructor(options: Camera3Options) {
        this.origin = options.origin ?? new Vector3();
        this.angles = options.angles ?? new Vector3();
        this.d = options.d || 1;
        this.distance = options.distance || Infinity;
    }
}

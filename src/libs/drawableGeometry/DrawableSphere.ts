import { Sphere, type SphereOptions } from "../geometry/Sphere";
import type { Vector3 } from "../math/Vector3";

export interface DrawableSphereOptions extends SphereOptions {
    color: Vector3;
    textureIndex?: number;
}

export class DrawableSphere extends Sphere {
    public color: Vector3;
    public textureIndex: number;

    constructor(options: DrawableSphereOptions) {
        super(options);
        
        this.color = options.color;
        this.textureIndex = options.textureIndex ?? -1;
    }

    putToArray(array: ArrayBufferView | Array<number>, offset = 0, relativeTo?: Vector3) {
        this.center.putToArray(array, offset, relativeTo);
        array[offset + 3] = this.radius;
        this.color.putToArray(array, offset + 4);
        // array[offset + 7] = this.textureIndex;
        this.angles.putToArray(array, offset + 8);

        return offset + 10;
    }
}

import { Sphere, type SphereOptions } from "../geometry/Sphere";
import type { Vector3 } from "../math/Vector3";

export interface DrawableSphereOptions<TextureName = null> extends SphereOptions {
    color: Vector3;
    textureName?: TextureName;
}

export class DrawableSphere<TextureName = null> extends Sphere {
    public color: Vector3;
    public textureName?: TextureName;

    constructor(options: DrawableSphereOptions<TextureName>) {
        super(options);
        
        this.color = options.color;
        this.textureName = options.textureName ?? null;
    }

    _getCloneConfig() {
        return {
            ...super._getCloneConfig(),
            color: this.color.clone(),
            textureName: this.textureName,
        };
    }

    clone() {
        return new DrawableSphere(this._getCloneConfig());
    }

    putToArray(array: ArrayBufferView | Array<number>, offset = 0, relativeTo?: Vector3) {
        this.center.putToArray(array, offset, relativeTo);
        array[offset + 3] = this.radius;
        this.color.putToArray(array, offset + 4);
        // array[offset + 7] = this.textureName;
        this.angles.moduloN(2 * Math.PI).putToArray(array, offset + 8);

        return offset + 10;
    }
}

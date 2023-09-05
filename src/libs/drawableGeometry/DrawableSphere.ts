import { Sphere, type SphereOptions } from "../geometry/Sphere";
import type { Vector3 } from "../math/Vector3";
import type { IDrawableGeometry, IDrawableGeometryOptions } from "./DrawableGeometry";

export interface DrawableSphereOptions extends SphereOptions, IDrawableGeometryOptions {
    
}

export class DrawableSphere extends Sphere implements IDrawableGeometry {
    public material: IDrawableGeometry['material'];

    constructor(options: DrawableSphereOptions) {
        super(options);
        
        this.material = options.material ?? null;
    }

    _getCloneConfig() {
        return {
            ...super._getCloneConfig(),
            material: this.material,
        };
    }

    clone() {
        return new DrawableSphere(this._getCloneConfig());
    }
}

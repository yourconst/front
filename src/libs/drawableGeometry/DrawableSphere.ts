import { Sphere, type SphereOptions } from "../geometry/Sphere";
import type { Vector3 } from "../math/Vector3";
import type { IDrawableGeometry, IDrawableGeometryOptions } from "./DrawableGeometry";

export interface DrawableSphereOptions extends SphereOptions, IDrawableGeometryOptions {
    
}

export class DrawableSphere extends Sphere implements IDrawableGeometry {
    public color: IDrawableGeometry['color'];
    public texture?: IDrawableGeometry['texture'];

    constructor(options: DrawableSphereOptions) {
        super(options);
        
        this.color = options.color;
        this.texture = options.texture ?? null;
    }

    _getCloneConfig() {
        return {
            ...super._getCloneConfig(),
            color: this.color.clone(),
            texture: this.texture,
        };
    }

    clone() {
        return new DrawableSphere(this._getCloneConfig());
    }
}

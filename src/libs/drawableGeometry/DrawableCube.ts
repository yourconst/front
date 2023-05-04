import { Cube, type CubeOptions } from "../geometry/Cube";
import type { Vector3 } from "../math/Vector3";
import type { IDrawableGeometry, IDrawableGeometryOptions } from "./DrawableGeometry";

export interface DrawableCubeOptions extends CubeOptions, IDrawableGeometryOptions {
    
}

export class DrawableCube extends Cube implements IDrawableGeometry {
    public color: IDrawableGeometry['color'];
    public texture?: IDrawableGeometry['texture'];

    constructor(options: DrawableCubeOptions) {
        super(options);
        
        this.color = options.color;
        this.texture = options.texture ?? null;
    }

    _getCloneConfig() {
        return {
            ...super._getCloneConfig(),
            color: this.color.clone(),
            textureName: this.texture,
        };
    }

    clone() {
        return new DrawableCube(this._getCloneConfig());
    }
}

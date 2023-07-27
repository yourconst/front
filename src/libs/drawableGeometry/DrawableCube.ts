import { Cube, type CubeOptions } from "../geometry/Cube";
import { Vector3 } from "../math/Vector3";
import type { IDrawableGeometry, IDrawableGeometryOptions } from "./DrawableGeometry";

export interface DrawableCubeOptions extends CubeOptions, IDrawableGeometryOptions {
    
}

export class DrawableCube extends Cube implements IDrawableGeometry {
    static createJoint(options: IDrawableGeometryOptions & {
        p0: Vector3;
        p1: Vector3;
        width?: number;
    }) {
        const { p0, p1, width, color, texture } = options;
        const center = p0.clone().plus(p1).multiplyN(0.5);
        const r = center.distanceTo(p0);

        const result = new DrawableCube({
            center,
            color,
            texture,
            sizes: new Vector3(width, width, r),
            radius: r,
        });

        result.rotation.setDirection(center.getDirectionTo(p1));

        return result;
    }

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

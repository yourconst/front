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
        const { p0, p1, width, material } = options;
        const center = p0.clone().plus(p1).multiplyN(0.5);
        const r = center.distanceTo(p0);

        const result = new DrawableCube({
            center,
            material,
            sizes: new Vector3(width, width, r),
            radius: r,
        });

        result.rotation.setDirection(center.getDirectionTo(p1));

        return result;
    }

    public material: IDrawableGeometry['material'];

    constructor(options: DrawableCubeOptions) {
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
        return new DrawableCube(this._getCloneConfig());
    }
}

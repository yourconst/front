import type { Material } from "../material/Material";
import { Segment3 } from "../math/Segment3";
import type { Vector3 } from "../math/Vector3";
import type { IDrawableGeometry, IDrawableGeometryOptions } from "./DrawableGeometry";

export interface DrawableSegment3Options extends IDrawableGeometryOptions {
    p0: Vector3;
    p1: Vector3;
    lineWidth?: number;
    disableDistanceSizing?: boolean;
}

export class DrawableSegment3 extends Segment3 {
    material: Material;
    lineWidth: number;
    disableDistanceSizing: boolean;

    constructor(options: DrawableSegment3Options) {
        super(options.p0, options.p1);
        this.material = options.material;
        this.lineWidth = options.lineWidth || 1;
        this.disableDistanceSizing = options.disableDistanceSizing ?? false;
    }
}

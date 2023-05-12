import { Segment3 } from "../math/Segment3";
import type { Vector3 } from "../math/Vector3";

export interface DrawableSegment3Options {
    p0: Vector3;
    p1: Vector3;
    color: Vector3;
    lineWidth?: number;
    disableDistanceSizing?: boolean;
}

export class DrawableSegment3 extends Segment3 {
    color: Vector3;
    lineWidth: number;
    disableDistanceSizing: boolean;

    constructor(options: DrawableSegment3Options) {
        super(options.p0, options.p1);
        this.color = options.color;
        this.lineWidth = options.lineWidth || 1;
        this.disableDistanceSizing = options.disableDistanceSizing ?? false;
    }
}

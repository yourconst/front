import { DrawableSegment3 } from "../../../drawableGeometry/DrawableSegment3";
import { DrawableSphere } from "../../../drawableGeometry/DrawableSphere";
import { Segment3 } from "../../../math/Segment3";
import { Vector2 } from "../../../math/Vector2";
import { Vector3 } from "../../../math/Vector3";
import type { Camera3 } from "../../Camera3";

export type Renderer3dContext2dSupportedGeometries = DrawableSegment3 | DrawableSphere;

export class Renderer3dContext2d {
    constructor(public ctx: CanvasRenderingContext2D) { }

    clear() {
        this.ctx.canvas.width = this.ctx.canvas.width;
        return this;
    }

    getScreenSize(absoluteSize: number, camera: Camera3) {
        return absoluteSize * camera.lens.f * camera.minSize * 0.0025;
    }

    getScreenPosition(v: Vector3, camera: Camera3) {
        const result = v.cloneXY().multiplyN(camera.minSize * camera.aspectRatio);
        result.y *= -1;
        return result.plus(camera.getHalfSizes());
    }

    _drawSegment(p0: Vector2, p1: Vector2, color: string, lineWidth = 1) {
        // console.log(p0, p1);
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.moveTo(p0.x, p0.y);
        this.ctx.lineTo(p1.x, p1.y);
        this.ctx.stroke();

        return this;
    }
    
    drawSegment(segment: DrawableSegment3, camera: Camera3, screenPlane = camera.getScreenPlane()) {
        const ap0 = screenPlane.tryGetRayIntersectionPoint(camera.origin.getRayToPoint(segment.p0));
        const ap1 = screenPlane.tryGetRayIntersectionPoint(camera.origin.getRayToPoint(segment.p1));
        const api = screenPlane.tryGetSegmentIntersectionPoint(segment);

        const rps = [ap0, ap1, api].filter(ap => ap)
                .map(ap => this.getScreenPosition(screenPlane.getRelativePosition(ap), camera));

        if (rps.length !== 2) {
            return this;
        }

        const lineWidth = segment.disableDistanceSizing ?
            segment.lineWidth :
            this.getScreenSize(segment.lineWidth, camera);

        this._drawSegment(rps[0], rps[1], segment.color.toRGB(), lineWidth);

        // this.ctx.beginPath();
        // this.ctx.strokeStyle = segment.color.toRGB();
        // this.ctx.lineWidth = segment.lineWidth;
        // this.ctx.moveTo(rps[0].x, rps[0].y);
        // this.ctx.lineTo(rps[1].x, rps[1].y);
        // this.ctx.stroke();

        return this;
    }

    drawPoint(point: DrawableSphere, camera: Camera3, screenPlane = camera.getScreenPlane()) {
        const ap = screenPlane.tryGetRayIntersectionPoint(camera.origin.getRayToPoint(point.center));

        // console.log(ap);

        if (!ap) {
            return this;
        }

        const rp = screenPlane.getRelativePosition(ap);
        // const rp = ap.clone().minus(screenPlane.center)
        //     .rotateY(-camera.angles.y)
        //     .rotateX(-camera.angles.x)
        //     .rotateZ(camera.angles.z);
        // console.log(rp);
        const sp = this.getScreenPosition(rp, camera);
        const radius = this.getScreenSize(point.radius, camera);

        // console.log(rp);

        this.ctx.beginPath();
        this.ctx.fillStyle = point.color.toRGB();
        this.ctx.ellipse(sp.x, sp.y, radius, radius, 0, 0, 2 * Math.PI);
        this.ctx.fill();

        return this;
    }

    drawObjects(objects: Renderer3dContext2dSupportedGeometries[], camera: Camera3) {
        const screenPlane = camera.getScreenPlane();

        for (const o of objects) {
            if (o instanceof DrawableSegment3) {
                this.drawSegment(o, camera, screenPlane);
            } else
            if (o instanceof DrawableSphere) {
                this.drawPoint(o, camera, screenPlane);
            }
        }

        return this;
    }

    drawAxes(camera: Camera3, options: {
        distance?: number
        length?: number;
        lineWidth?: number;
        relativeCenter?: Vector2;
    } = {}) {
        const {
            length = 0.04, distance = 10,
            lineWidth = 2, relativeCenter = new Vector2(0.0, 0.0),
        } = options;

        const sp = camera.getScreenPlane();
        const p0 = sp.normal.clone().multiplyN(camera.lens.f + distance).plus(camera.origin);
        const rl = length * distance / camera.lens.f;

        const axes = [
            new DrawableSegment3({
                p0,
                p1: p0.clone().plus(new Vector3(rl, 0, 0)),
                color: new Vector3(1, 0, 0),
                lineWidth,
                disableDistanceSizing: true,
            }),
            new DrawableSegment3({
                p0,
                p1: p0.clone().plus(new Vector3(0, rl, 0)),
                color: new Vector3(0, 1, 0),
                lineWidth,
                disableDistanceSizing: true,
            }),
            new DrawableSegment3({
                p0,
                p1: p0.clone().plus(new Vector3(0, 0, rl)),
                color: new Vector3(0, 0, 1),
                lineWidth,
                disableDistanceSizing: true,
            }),
        ];

        axes.sort((a, b) => b.p1.distance2To(camera.origin) - a.p1.distance2To(camera.origin))
            .forEach((a, i) => a.lineWidth *= i * 0.1 + 1);
        
        for (const axis of axes) {
            this.drawSegment(axis, camera, sp);
        }

        return this;
    }
}

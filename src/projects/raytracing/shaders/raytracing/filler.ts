import type { Gl2Utils } from "../../../../helpers/webgl";
import { DrawableCube } from "../../../../libs/drawableGeometry/DrawableCube";
import type { IDrawableGeometry } from "../../../../libs/drawableGeometry/DrawableGeometry";
import { Vector3 } from "../../../../libs/math/Vector3";
import type { Camera3 } from "../../../../libs/render/Camera3";
import { WebGLStructFiller } from "../StructFiller";


export class Filler extends WebGLStructFiller {
    static readonly sizes = {
        ...WebGLStructFiller.sizes,
        Header: WebGLStructFiller.sizes.Matrix3x3 + 8,
        DrawableGeometry: 24,
    };

    static readonly maxObjectsCount = 400;

    static getMaxBufferFloatsSize() {
        return this.sizes.Header + this.maxObjectsCount * this.sizes.DrawableGeometry;
    }

    static cubesAsSpheres = false;

    static DrawableGeometry(ut: Gl2Utils, g: IDrawableGeometry, f32a: Float32Array, offset = 0, i32a: Int32Array, relativeTo?: Vector3) {
        const isCube = g instanceof DrawableCube && !this.cubesAsSpheres;

        this.Vector3(g.center, f32a, offset + 0, relativeTo);
        f32a[offset + 3] = isCube ? 1 : 0;
        this.Vector3(isCube ? g.sizes : new Vector3(g.radius), f32a, offset + 4);
        i32a[offset + 7] = ut.getTextureIndex(g.texture);
        this.Vector3(g.color, f32a, offset + 8);

        this.Matrix3x3(
            g.rotation.matrix(),
            f32a, offset + 12,
        );

        // const rotation = g.angles.getSinCos();
        // this.Vector2(rotation.x, f32a, offset + 12);
        // this.Vector2(rotation.y, f32a, offset + 14);
        // this.Vector2(rotation.z, f32a, offset + 16);

        // f32a[offset + 8] = g.angles.x;
        // f32a[offset + 9] = g.angles.y;
        // f32a[offset + 10] = g.angles.z;

        return offset + this.sizes.DrawableGeometry;
    }

    static Info(ut: Gl2Utils, { camera, lights, objects }: {
        camera: Camera3;
        lights: IDrawableGeometry[];
        objects: IDrawableGeometry[];
    }) {
        const m3x3Offset = 0;
        const headOffset = m3x3Offset + this.sizes.Matrix3x3;
        const bodyOffset = headOffset + 8;

        const dgSize = this.sizes.DrawableGeometry;

        const objectsCount = lights.length + objects.length;

        const f32a = new Float32Array(bodyOffset + dgSize * objectsCount);
        const i32a = new Int32Array(f32a.buffer);

        this.Matrix3x3(
            camera.getRotationMatrix3x3(),
            f32a, m3x3Offset,
        );
        this.Vector2(camera.sizes, f32a, headOffset);
        f32a[headOffset + 2] = 1 / camera.exposure;
        f32a[headOffset + 3] = camera.d;
        f32a[headOffset + 4] = camera.distance;
        f32a[headOffset + 5] = camera.ambient;
        i32a[headOffset + 6] = lights.length;
        i32a[headOffset + 7] = lights.length + objects.length;

        let offset = bodyOffset;
        for (const dgs of [lights, objects]) {
            for (const dg of dgs) {
                offset = this.DrawableGeometry(ut, dg, f32a, offset, i32a, camera.origin);
            }
        }

        return f32a.buffer;
    }
}

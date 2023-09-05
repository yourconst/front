import type { Gl2Utils } from "../../../../helpers/webgl";
import { DrawableCube } from "../../../../libs/drawableGeometry/DrawableCube";
import type { IDrawableGeometry } from "../../../../libs/drawableGeometry/DrawableGeometry";
import { Vector3 } from "../../../../libs/math/Vector3";
import type { Camera3 } from "../../../../libs/render/Camera3";
import { Texture } from "../../../../libs/render/Texture";
import { WebGLStructFiller } from "../StructFiller";

export class Filler extends WebGLStructFiller {
    static readonly sizes = {
        ...WebGLStructFiller.sizes,
        Lens: 4,
        Header: WebGLStructFiller.sizes.Matrix3x3 + 4 + 12,
        Material: 16,
        DrawableGeometry: 16 + 20,
    };

    static readonly maxObjectsCount = 400;

    static getMaxBufferFloatsSize() {
        return this.sizes.Header + this.maxObjectsCount * this.sizes.DrawableGeometry;
    }

    static cubesAsSpheres = false;

    static specularity = new Vector3(1, 1, 1);
    static transparency = new Vector3(0, 0, 0);
    static Material(ut: Gl2Utils, g: IDrawableGeometry, f32a: Float32Array, offset = 0, i32a: Int32Array) {
        const m = g.material;
        this.Vector3(m.color.rgb, f32a, offset + 0);
        i32a[offset + 3] = ut.getFrameTextureIndex(m.texture);
        this.Vector3(new Vector3(0, 1, 0), f32a, offset + 4);
        const nm = ut.getFrameTextureIndex(m.normalMap);
        i32a[offset + 7] = nm === -1 ? i32a[offset + 3] : nm;
        this.Vector3(this.specularity, f32a, offset + 8);
        i32a[offset + 11] = ut.getFrameTextureIndex(m.reflectance);
        this.Vector3(this.transparency, f32a, offset + 12);
        i32a[offset + 15] = -1;

        return offset + this.sizes.Material;
    }

    static DrawableGeometry(ut: Gl2Utils, g: IDrawableGeometry, f32a: Float32Array, offset = 0, i32a: Int32Array, relativeTo?: Vector3) {
        const isCube = g instanceof DrawableCube && !this.cubesAsSpheres;

        this.Vector3(g.center, f32a, offset + 0, relativeTo);
        f32a[offset + 3] = isCube ? 1 : 0;
        this.Vector3(isCube ? g.sizes : new Vector3(g.radius, 1.3 * g.radius, 1 / g.radius), f32a, offset + 4);

        this.Matrix3x3(g.rotation.matrix(), f32a, offset + 8);

        this.Material(ut, g, f32a, offset + 20, i32a);

        return offset + this.sizes.DrawableGeometry;
    }

    static Lens(l: Camera3['lens'], f32a: Float32Array, offset = 0) {
        f32a[offset + 0] = l.f;
        f32a[offset + 1] = l.d;
        f32a[offset + 2] = l.z;

        return offset + this.sizes.Lens;
    }

    static Info(ut: Gl2Utils, f32a: Float32Array, { camera, lights, objects }: {
        camera: Camera3;
        lights: IDrawableGeometry[];
        objects: IDrawableGeometry[];
    }, prevSampleMultiplier = 0) {
        let o = 0;
        const bodyOffset = o + this.sizes.Header;

        const dgSize = this.sizes.DrawableGeometry;

        const objectsCount = lights.length + objects.length;
        const i32a = new Int32Array(f32a.buffer);

        const o1 = o;
        o = this.Matrix3x3(
            camera.getRotationMatrix3x3(),
            f32a, o,
        );
        const o2 = o;
        o = this.Lens(camera.lens, f32a, o);
        const o3 = o;
        o = this.Vector2(camera.getHalfSizes(), f32a, o);
        const o4 = o;
        f32a[o++] = camera.maxSize;
        f32a[o++] = 1 / camera.exposure;
        f32a[o++] = camera.distance;
        f32a[o++] = camera.ambient;
        i32a[o++] = lights.length;
        i32a[o++] = lights.length + objects.length;
        f32a[o++] = Math.random();
        i32a[o++] = camera.pathtracing.depth;
        i32a[o++] = camera.pathtracing.perPixelCount;
        f32a[o++] = prevSampleMultiplier;
        const o5 = o;
        // console.log(o1,o2,o3,o4,o5,bodyOffset);

        let offset = bodyOffset;
        for (const dgs of [lights, objects]) {
            for (const dg of dgs) {
                offset = this.DrawableGeometry(ut, dg, f32a, offset, i32a, camera.origin);
            }
        }

        return bodyOffset + dgSize * objectsCount;
    }
}

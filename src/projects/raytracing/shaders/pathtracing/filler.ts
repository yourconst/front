import type { Gl2Utils } from "../../../../helpers/webgl";
import { DrawableCube } from "../../../../libs/drawableGeometry/DrawableCube";
import type { IDrawableGeometry } from "../../../../libs/drawableGeometry/DrawableGeometry";
import type { Material } from "../../../../libs/material/Material";
import { Vector2 } from "../../../../libs/math/Vector2";
import { Vector3 } from "../../../../libs/math/Vector3";
import type { Camera3 } from "../../../../libs/render/Camera3";
import { WebGLStructFiller } from "../StructFiller";

export class Filler extends WebGLStructFiller {
    static readonly sizes = {
        ...WebGLStructFiller.sizes,
        Lens: 4,
        Header: WebGLStructFiller.sizes.Matrix3x3 + 4 + 12 + 4,
        Material: 24,
        DrawableGeometry: 20,
    };

    static readonly maxMaterialsCount = 256;
    static readonly maxObjectsCount = 256;

    static getMaxBufferFloatsSize() {
        return this.sizes.Header +
            this.maxMaterialsCount * this.sizes.Material +
            this.maxObjectsCount * this.sizes.DrawableGeometry;
    }

    static cubesAsSpheres = false;

    private static _frameMaterials = new Map<string, [number, Material]>();
    static getFrameMaterialIndex(m: Material) {
        const key = m.getKey();
        let info = this._frameMaterials.get(key);

        if (!info) {
            info = [this._frameMaterials.size, m];
            this._frameMaterials.set(key, info);
        } else {
            // console.log(m, [...this._frameMaterials.keys()][index]);
        }

        return info[0];
    }

    static Material(ut: Gl2Utils, m: Material, f32a: Float32Array, offset = 0, i32a: Int32Array) {
        this.Vector3(m.light?.rgb, f32a, offset + 0);
        i32a[offset + 3] = ut.getFrameTextureIndex(m.colorMap);
        this.Vector3(m.color?.rgb, f32a, offset + 4);
        i32a[offset + 7] = ut.getFrameTextureIndex(m.specularityMap);
        this.Vector3(m.specularity?.rgb, f32a, offset + 8);
        i32a[offset + 11] = ut.getFrameTextureIndex(m.normalMap);
        this.Vector3(m.refraction || new Vector3(1,1,1), f32a, offset + 12);
        i32a[offset + 15] = ut.getFrameTextureIndex(m.transparencyMap);
        f32a[offset + 16] = m.transparency || 0;
        this.Vector2(m.uv?.offset, f32a, offset + 18);
        this.Vector2(m.uv?.scale || new Vector2(1,1), f32a, offset + 20);

        return offset + this.sizes.Material;
    }

    static DrawableGeometry(ut: Gl2Utils, g: IDrawableGeometry, f32a: Float32Array, offset = 0, i32a: Int32Array, relativeTo?: Vector3) {
        const isCube = g instanceof DrawableCube && !this.cubesAsSpheres;

        this.Vector3(g.center, f32a, offset + 0, relativeTo);
        f32a[offset + 3] = isCube ? 1 : 0;
        this.Vector3(isCube ? g.sizes : new Vector3(g.radius), f32a, offset + 4);

        i32a[offset + 7] = this.getFrameMaterialIndex(g.material);

        this.Matrix3x3(g.rotation.matrix(), f32a, offset + 8);

        return offset + this.sizes.DrawableGeometry;
    }

    static Lens(l: Camera3['lens'], f32a: Float32Array, offset = 0) {
        f32a[offset + 0] = l.f;
        f32a[offset + 1] = l.d;
        f32a[offset + 2] = l.z;
        f32a[offset + 3] = l.fd;

        return offset + this.sizes.Lens;
    }

    static Info(ut: Gl2Utils, f32a: Float32Array, { camera, lights, objects }: {
        camera: Camera3;
        lights: IDrawableGeometry[];
        objects: IDrawableGeometry[];
    }, prevSampleMultiplier = 0) {
        const i32a = new Int32Array(f32a.buffer);

        const objectsCount = lights.length + objects.length;

        let o = 0;
        o = this.Matrix3x3(
            camera.getRotationMatrix3x3(),
            f32a, o,
        );
        o = this.Lens(camera.lens, f32a, o);
        o = this.Vector2(camera.getHalfSizes(), f32a, o);
        f32a[o++] = camera.maxSize;
        f32a[o++] = 1 / camera.exposure;
        f32a[o++] = camera.distance;
        f32a[o++] = camera.ambient;
        i32a[o++] = lights.length;
        i32a[o++] = objectsCount;
        i32a[o++] = camera.pathtracing.depth;
        i32a[o++] = camera.pathtracing.perPixelCount;
        f32a[o++] = prevSampleMultiplier;
        o+=3;
        f32a[o++] = (1<<23) * Math.random();
        f32a[o++] = (1<<23) * Math.random();
        f32a[o++] = (1<<23) * Math.random();
        f32a[o++] = (1<<23) * Math.random();

        // this._frameMaterials = new Map();

        o = this.sizes.Header + this.maxMaterialsCount * this.sizes.Material;
        for (const dgs of [lights, objects]) {
            for (const dg of dgs) {
                o = this.DrawableGeometry(ut, dg, f32a, o, i32a, camera.origin);
                // console.log('Entity', o);
            }
        }

        o = this.sizes.Header;
        for (const [key, [index, m]] of this._frameMaterials) {
            // console.log(o, index, m);
            o = this.Material(ut, m, f32a, o, i32a);
            // console.log('Material', o);
        }

        // this._frameMaterials.clear();

        // return this.getMaxBufferFloatsSize();

        return this.sizes.Header + this.maxMaterialsCount * this.sizes.Material + objectsCount * this.sizes.DrawableGeometry;
    }
}

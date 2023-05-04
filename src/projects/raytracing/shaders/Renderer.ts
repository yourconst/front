import { DrawableCube } from "../../../libs/drawableGeometry/DrawableCube";
import type { IDrawableGeometry } from "../../../libs/drawableGeometry/DrawableGeometry";
import type { Matrix3x3 } from "../../../libs/math/Matrix3x3";
import type { Vector2 } from "../../../libs/math/Vector2";
import type { Vector3 } from "../../../libs/math/Vector3";
import type { Camera3 } from "../../../libs/render/Camera3";



class WebGLStructFiller {
    static readonly sizes = {
        Matrix3x3: 12,
        Vector2: 2,
        Vector3: 3,
        DrawableGeometry: 20,
    };

    static Matrix3x3(m: Matrix3x3, f32a: Float32Array, offset = 0) {
        f32a[offset + 0] = m.cells[0];
        f32a[offset + 1] = m.cells[1];
        f32a[offset + 2] = m.cells[2];

        f32a[offset + 4] = m.cells[3];
        f32a[offset + 5] = m.cells[4];
        f32a[offset + 6] = m.cells[5];

        f32a[offset + 8] = m.cells[6];
        f32a[offset + 9] = m.cells[7];
        f32a[offset + 10] = m.cells[8];

        return offset + this.sizes.Matrix3x3;
    }

    static Vector2(v: Vector2, f32a: Float32Array, offset = 0) {
        f32a[offset + 0] = v.x;
        f32a[offset + 1] = v.y;
        return offset + this.sizes.Vector2;
    }

    static Vector3(v: Vector3, f32a: Float32Array, offset = 0, relativeTo?: Vector3) {
        f32a[offset + 0] = v.x - (relativeTo?.x || 0);
        f32a[offset + 1] = v.y - (relativeTo?.y || 0);
        f32a[offset + 2] = v.z - (relativeTo?.z || 0);
        return offset + this.sizes.Vector3;
    }

    static cubesAsSpheres = false;

    static DrawableGeometry(g: IDrawableGeometry, f32a: Float32Array, offset = 0, i32a: Int32Array, relativeTo?: Vector3) {
        this.Vector3(g.center, f32a, offset + 0, relativeTo);
        f32a[offset + 3] = g.radius;
        this.Vector3(g.color, f32a, offset + 4);
        i32a[offset + 7] = g instanceof DrawableCube && !this.cubesAsSpheres ? 1 : 0;
        i32a[offset + 8] = g.texture?.index ?? -1;

        // this.Matrix3x3(
        //     Matrix3x3.createRotationFromAnglesXYZ(g.angles),
        //     f32a, offset + 8
        // );

        const rotation = g.angles.getSinCos();
        this.Vector2(rotation.x, f32a, offset + 12);
        this.Vector2(rotation.y, f32a, offset + 14);
        this.Vector2(rotation.z, f32a, offset + 16);

        // f32a[offset + 8] = g.angles.x;
        // f32a[offset + 9] = g.angles.y;
        // f32a[offset + 10] = g.angles.z;

        return offset + this.sizes.DrawableGeometry;
    }
}

globalThis['WebGLStructFiller'] = WebGLStructFiller;

export class Renderer {
    static fillBufferRaytracing({ camera, lights, objects }: {
        camera: Camera3;
        lights: IDrawableGeometry[];
        objects: IDrawableGeometry[];
    }) {
        const m3x3Offset = 0;
        const headOffset = m3x3Offset + WebGLStructFiller.sizes.Matrix3x3;
        const bodyOffset = headOffset + 8;

        const dgSize = WebGLStructFiller.sizes.DrawableGeometry;
        const maxDgCount = 100;

        const f32a = new Float32Array(bodyOffset + dgSize * maxDgCount);
        const i32a = new Int32Array(f32a.buffer);

        WebGLStructFiller.Matrix3x3(
            camera.getRotationMatrix3x3(),
            f32a, m3x3Offset,
        );
        WebGLStructFiller.Vector2(camera.sizes, f32a, headOffset);
        f32a[headOffset + 2] = camera.d;
        f32a[headOffset + 3] = camera.distance;
        i32a[headOffset + 4] = lights.length;
        i32a[headOffset + 5] = lights.length + objects.length;

        // console.log(f32a);

        let offset = bodyOffset;
        for (const dgs of [lights, objects]) {
            for (const dg of dgs) {
                // console.log(offset);
                offset = WebGLStructFiller.DrawableGeometry(dg, f32a, offset, i32a, camera.origin);
            }
        }

        return f32a.buffer;
    }
}

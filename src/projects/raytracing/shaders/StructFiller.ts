import type { Matrix3x3 } from "../../../libs/math/Matrix3x3";
import type { Vector2 } from "../../../libs/math/Vector2";
import type { Vector3 } from "../../../libs/math/Vector3";

export class WebGLStructFiller {
    static readonly sizes = {
        Matrix3x3: 12,
        Vector2: 2,
        Vector3: 3,
        DrawableGeometry: 20,
    };

    static Matrix3x3(m: Matrix3x3, f32a: Float32Array, offset = 0) {
        f32a[offset + 0] = m.cells[0];
        f32a[offset + 1] = m.cells[3];
        f32a[offset + 2] = m.cells[6];

        f32a[offset + 4] = m.cells[1];
        f32a[offset + 5] = m.cells[4];
        f32a[offset + 6] = m.cells[7];

        f32a[offset + 8] = m.cells[2];
        f32a[offset + 9] = m.cells[5];
        f32a[offset + 10] = m.cells[8];

        return offset + this.sizes.Matrix3x3;
    }

    static Vector2(v: Vector2, f32a: Float32Array, offset = 0, relativeTo?: Vector2) {
        if (v) {
            f32a[offset + 0] = v.x - (relativeTo?.x || 0);
            f32a[offset + 1] = v.y - (relativeTo?.y || 0);
        }
        return offset + this.sizes.Vector2;
    }

    static Vector3(v: Vector3, f32a: Float32Array, offset = 0, relativeTo?: Vector3) {
        if (v) {
            f32a[offset + 0] = v.x - (relativeTo?.x || 0);
            f32a[offset + 1] = v.y - (relativeTo?.y || 0);
            f32a[offset + 2] = v.z - (relativeTo?.z || 0);
        }
        return offset + this.sizes.Vector3;
    }
}

globalThis['WebGLStructFiller'] = WebGLStructFiller;

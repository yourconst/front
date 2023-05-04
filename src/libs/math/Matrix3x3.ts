import { Vector3 } from "./Vector3";

interface NumberArray {
    readonly length: number;
    [index: number]: number;
}

export class Matrix3x3 {
    static createRotationX(ax: number) {
        const cosx = Math.cos(ax), sinx = Math.sin(ax);

        return new Matrix3x3([
            1, 0, 0,
            0, cosx, -sinx,
            0, sinx, cosx,
        ]);
    }
    static createRotationY(ay: number) {
        const cosy = Math.cos(ay), siny = Math.sin(ay);

        return new Matrix3x3([
            cosy, 0, siny,
            0, 1, 0,
            -siny, 0, cosy,
        ]);
    }
    static createRotationZ(az: number) {
        const cosz = Math.cos(az), sinz = Math.sin(az);

        return new Matrix3x3([
            cosz, -sinz, 0,
            sinz, cosz, 0,
            0, 0, 1,
        ]);
    }

    static createRotationFromAngles(as: Vector3, order: ('X' | 'Y' | 'Z')[]) {
        let result: Matrix3x3;

        for (const a of order) {
            let tmp: Matrix3x3;
            // Matrix3x3[`createRotation${a}`](as[a.toLowerCase()]);
            if (a === 'X') tmp = this.createRotationX(as.x); else
            if (a === 'Y') tmp = this.createRotationY(as.y); else
            if (a === 'Z') tmp = this.createRotationZ(as.z);
            
            if (result) {
                result = result.multiply3x3(tmp);
            } else {
                result = tmp;
            }
        }

        return result;
    }

    static createRotationFromAnglesXYZ(as: Vector3) {
        return Matrix3x3.createRotationX(as.x)
            .multiply3x3(Matrix3x3.createRotationY(as.y))
            .multiply3x3(Matrix3x3.createRotationZ(as.z));
    }

    static createRotationFromAnglesZYX(as: Vector3) {
        return Matrix3x3.createRotationZ(as.z)
            .multiply3x3(Matrix3x3.createRotationY(as.y))
            .multiply3x3(Matrix3x3.createRotationX(as.x));
    }

    static createRotationFromAnglesZXY(as: Vector3) {
        return Matrix3x3.createRotationZ(as.z)
            .multiply3x3(Matrix3x3.createRotationX(as.x))
            .multiply3x3(Matrix3x3.createRotationY(as.y));
    }

    constructor(public cells: NumberArray) { }

    multiply3x3(m: Matrix3x3) {
        const l = this.cells;
        const r = m.cells;

        return new Matrix3x3([
            l[0]*r[0] + l[1]*r[3] + l[2]*r[6],
            l[0]*r[1] + l[1]*r[4] + l[2]*r[7],
            l[0]*r[2] + l[1]*r[5] + l[2]*r[8],

            l[3]*r[0] + l[4]*r[3] + l[5]*r[6],
            l[3]*r[1] + l[4]*r[4] + l[5]*r[7],
            l[3]*r[2] + l[4]*r[5] + l[5]*r[8],

            l[6]*r[0] + l[7]*r[3] + l[8]*r[6],
            l[6]*r[1] + l[7]*r[4] + l[8]*r[7],
            l[6]*r[2] + l[7]*r[5] + l[8]*r[8],
        ]);
    }

    multiplyVector3Column(v3: Vector3) {
        return new Vector3(
            this.cells[0] * v3.x + this.cells[1] * v3.y + this.cells[2] * v3.z,
            this.cells[3] * v3.x + this.cells[4] * v3.y + this.cells[5] * v3.z,
            this.cells[6] * v3.x + this.cells[7] * v3.y + this.cells[8] * v3.z,
        );
    }
}

globalThis['Matrix3x3'] = Matrix3x3;

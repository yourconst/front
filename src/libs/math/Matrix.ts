import { Vector2 } from "./Vector2";
import { Vector3 } from "./Vector3";

interface NumberArray {
    readonly length: number;
    [index: number]: number;
}

// interface NumberArrayConstructor {
//     new (length: number): NumberArray;
// }

export class Matrix {
    static createRotation3x3FromAngles(ax: number, ay: number, az: number) {
        const cosx = Math.cos(ax), sinx = Math.sin(ax),
            cosy = Math.cos(ay), siny = Math.sin(ay),
            cosz = Math.cos(az), sinz = Math.sin(ax);


        const cells = new Float64Array(9);

        cells[0] = cosy * cosz;
        cells[1] = sinx * siny * cosz + sinz * cosx;
        cells[2] = sinx * sinz - siny * cosx * cosz;

        cells[3] = -sinz * cosy;
        cells[4] = -sinx * siny * sinz + cosx * cosz;
        cells[5] = sinx * cosz + siny * sinz * cosx;

        cells[6] = siny;
        cells[7] = -sinx * cosy;
        cells[8] = cosx * cosy;

        return new Matrix(new Vector2(3, 3), cells);
    }

    static createRotation3x3FromAnglesVector(v3: Vector3) {
        return this.createRotation3x3FromAngles(v3.x, v3.y, v3.z);
    }

    constructor(public sizes: Vector2, public cells: NumberArray) { }

    putToArray(array: ArrayBufferView | Array<number>, offset = 0) {
        for (let i = 0; i < this.cells.length; ++i) {
            array[offset + i] = this.cells[i];
        }

        return offset + this.cells.length;
    }
    
    getIndex(x: number, y: number) {
        return y + x * this.sizes.y;
    }

    get(x: number, y: number) {
        return this.cells[this.getIndex(x, y)];
    }

    multiplyVectorColumn<NA extends NumberArray = Array<number>>(
        vc: NumberArray,
        // @ts-ignore
        AC: new (length: number) => NA = Array,
    ): NA {
        if (vc.length !== this.sizes.x) { throw new Error(); }

        const result = new AC(vc.length);

        for (let i = 0; i < result.length; ++i) {
            const offset = this.getIndex(i, 0);
            result[i] = 0;

            for (let j = 0; j < this.sizes.y; ++j) {
                result[i] += this.cells[offset + j];
            }

            result[i] *= vc[i];
        }

        return result;
    }

    multiplyVector2Column(v2: Vector2) {
        if (2 !== this.sizes.x) { throw new Error(); }
        
        return new Vector2(
            v2.x * (this.cells[0] + this.cells[1]),
            v2.y * (this.cells[2] + this.cells[3]),
        );
    }

    multiplyVector3Column(v3: Vector3) {
        if (3 !== this.sizes.x) { throw new Error(); }
        
        return new Vector3(
            v3.x * (this.cells[0] + this.cells[1] + this.cells[2]),
            v3.y * (this.cells[3] + this.cells[4] + this.cells[5]),
            v3.z * (this.cells[6] + this.cells[7] + this.cells[8]),
        );
    }
}

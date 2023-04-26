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
            cosz = Math.cos(az), sinz = Math.sin(az);

        const cells = new Float64Array(9);

        cells[0] = cosy * cosz;
        cells[1] = -sinz * cosy;
        cells[2] = siny;
    
        cells[3] = sinx * siny * cosz + sinz * cosx;
        cells[4] = -sinx * siny * sinz + cosx * cosz;
        cells[5] = -sinx * cosy;

        cells[6] = sinx * sinz - siny * cosx * cosz;
        cells[7] = sinx * cosz + siny * sinz * cosx;
        cells[8] = cosx * cosy;

        return new Matrix(new Vector2(3, 3), cells);
    }

    static createRotation3x3FromAnglesVector(v3: Vector3) {
        return this.createRotation3x3FromAngles(v3.x, v3.y, v3.z);
    }

    constructor(public sizes: Vector2, public cells: NumberArray) { }

    // TODO: other sizes supporting
    putToArray(array: ArrayBufferView | Array<number>, offset = 0) {
        // for (let i = 0; i < this.cells.length; ++i) {
        //     array[offset + i] = this.cells[i];
        // }

        array[offset + 0] = this.cells[0];
        array[offset + 1] = this.cells[1];
        array[offset + 2] = this.cells[2];

        array[offset + 4] = this.cells[3];
        array[offset + 5] = this.cells[4];
        array[offset + 6] = this.cells[5];

        array[offset + 8] = this.cells[6];
        array[offset + 9] = this.cells[7];
        array[offset + 10] = this.cells[8];

        // @ts-ignore
        // console.log(array.slice(offset, offset + 9));

        return offset + this.cells.length + 3;
    }
    
    getIndex(x: number, y: number) {
        return x + y * this.sizes.x;
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

        const result = new AC(this.sizes.y);

        for (let y = 0; y < this.sizes.y; ++y) {
            const offset = this.getIndex(y, 0);
            result[y] = 0;

            for (let x = 0; x < this.sizes.x; ++x) {
                result[y] += this.cells[offset + x] * vc[x];
            }
        }

        return result;
    }

    multiplyVector2Column(v2: Vector2) {
        if (2 !== this.sizes.x) { throw new Error(); }
        
        return new Vector2(
            v2.x * this.cells[0] + v2.y * this.cells[2],
            v2.x * this.cells[1] + v2.y * this.cells[3],
        );
    }

    multiplyVector3Column(v3: Vector3) {
        if (3 !== this.sizes.x) { throw new Error(); }
        
        return new Vector3(
            this.cells[0] * v3.x + this.cells[3] * v3.y + this.cells[6] * v3.z,
            this.cells[1] * v3.x + this.cells[4] * v3.y + this.cells[7] * v3.z,
            this.cells[2] * v3.x + this.cells[5] * v3.y + this.cells[8] * v3.z,
        );
    }
}

import type { Gl2Utils } from "../../helpers/webgl";
import { Range } from "../math/Range";
import { Vector2 } from "../math/Vector2";

export type ArrayCalculationType = 'avg' | 'max';
export type PixelCalculationType = 'avg' | 'max';

export interface ExposureCalculatorOptions {
    enabled?: boolean;
    relativeCenter?: Vector2;
    relativeSizes?: Vector2;
    relativeTargetValue?: number;
    arrayType?: ArrayCalculationType;
    pixelType?: PixelCalculationType;
    range?: Range;
    speed?: number;
}

export class ExposureCalculator {
    enabled: boolean;
    relativeCenter: Vector2;
    relativeSizes: Vector2;
    relativeTargetValue: number;
    arrayType: ArrayCalculationType;
    pixelType: PixelCalculationType;
    range: Range;
    speed: number;

    constructor(options: ExposureCalculatorOptions = {}) {
        this.enabled = options.enabled ?? true;
        this.relativeCenter = options.relativeCenter ?? new Vector2(0.5, 0.5);
        this.relativeSizes = options.relativeSizes ?? new Vector2(0.1, 0.1);
        this.relativeTargetValue = Range.getClosestRangeValue(options.relativeTargetValue ?? 0.25, 0, 1);
        this.arrayType = options.arrayType ?? 'avg';
        this.pixelType = options.pixelType ?? 'max';
        this.range = options.range ?? new Range(0.001, 100);
        this.speed = Range.getClosestRangeValue(options.speed ?? 0.5, 0.01, 1);
    }

    calc(exposure: number, ut: Gl2Utils) {
        if (!this.enabled) {
            return exposure;
        }

        const ro = this.relativeSizes.clone().multiplyN(-0.5).plus(this.relativeCenter);
        const info = ut.readPixelsUV(ro, this.relativeSizes);

        let value = 0;

        for (let i=0; i < info.pixelsCount; ++i) {
            const ri = i << 2;
            const cv = this.pixelType === 'avg' ?
                (info.data[ri + 0] + info.data[ri + 1] + info.data[ri + 2]) / 3 :
                Math.max(info.data[ri + 0], info.data[ri + 1], info.data[ri + 2]);

            if (this.arrayType === 'avg') {
                value += cv;
            } else {
                value = Math.max(value, cv);
            }
        }

        if (this.arrayType === 'avg') {
            value /= info.pixelsCount;
        }

        return this._alg(exposure, value);
    }

    get absoluteTargetValue() {
        return (this.relativeTargetValue * 254) >> 0;
    }

    _alg(exposure: number, value: number) {
        // value >>= 0;
        const target = this.absoluteTargetValue;
        const diff = value - target;

        const mult = this.speed * Math.pow(Math.abs(diff) / 254, 2);

        let result = exposure * (1 - Math.sign(diff) * mult);

        if (!this.range.isValueInside(result)) {
            result = this.range.getClosestRangeValue(result);
        }

        return result;
    }
}

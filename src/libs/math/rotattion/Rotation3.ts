import { Rotation3Quaternion } from './Rotation3Quaternion';
import { Rotation3Matrix } from './Rotation3Matrix';

export namespace Rotation3 {
    export const Quaternion = Rotation3Quaternion;
    export const Matrix = Rotation3Matrix;
}

globalThis['Rotation3'] = Rotation3;

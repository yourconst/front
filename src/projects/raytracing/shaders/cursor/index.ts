import { Vector2 } from "../../../../libs/math/Vector2";
import vertexSource from '../standard.vert?raw';
import fragmentSource from './index.frag?raw';

const sz = 0.1;
const szw = sz / 2;
const szr = (sz + szw) / 2;

// right top
const vd0 = [
    new Vector2(sz, sz),
    new Vector2(szw, sz),
    new Vector2(szw, szr),
    new Vector2(szr, szr),
    new Vector2(szr, szw),
    new Vector2(sz, szw),
];

// left top
const vd1 = vd0.map(v => v.clone().multiply(new Vector2(-1, +1)));
// left bottom
const vd2 = vd0.map(v => v.clone().multiply(new Vector2(-1, -1)));
// right bottom
const vd3 = vd0.map(v => v.clone().multiply(new Vector2(+1, -1)));

const objectsCount = 4;
const objectVerticesCount = vd0.length;

const vertexData = new Float32Array(
    [vd0, vd1, vd2, vd3].flat().map(v => [v.x, v.y]).flat(),
);

export const vertex = {
    objectsCount,
    objectVerticesCount,
    data: vertexData,
    source: vertexSource,
};

export const fragment = {
    source: fragmentSource,
};

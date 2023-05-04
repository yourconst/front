import vertexSource from './standard.vert?raw';
import fragmentSource from './raytracing.frag?raw';

const vertexData = new Float32Array([
    -1.0, 1.0, // top left
    -1.0, -1.0, // bottom left
    1.0, 1.0, // top right
    1.0, -1.0, // bottom right
]);

export const vertex = {
    data: vertexData,
    source: vertexSource,
};

export const fragment = {
    source: fragmentSource,
};

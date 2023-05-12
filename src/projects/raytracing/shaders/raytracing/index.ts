import vertexSource from '../standard.vert?raw';
import fragmentSource from './index.frag?raw';
import type { Gl2Utils } from '../../../../helpers/webgl';
import { Gl2Program } from '../../../../helpers/webgl/Program';
import { Filler } from './filler';
import { Texture, type RawTextureSource } from '../../../../libs/render/Texture';

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

export class RaytracingProgram extends Gl2Program<'position', null, 'Info'> {
    skyboxTexture: Texture;

    constructor(public ut: Gl2Utils, options: {
        skyboxSource: RawTextureSource,
    }) {
        super(ut, {
            shaders: {
                vertex: [vertexSource],
                fragment: [fragmentSource],
            },
            attributes: ['position'],
            ubos: ['Info'],
        });

        this.ut.createBufferAndData(vertexData);
        this.ut.gl.enableVertexAttribArray(this.locations.attribute.position);
        this.ut.gl.vertexAttribPointer(
            this.locations.attribute.position,
            2,
            this.ut.gl.FLOAT,
            false,
            2 * 4,
            0,
        );
        this.ut.bufferData(this.locations.ubo.Info, new Float32Array(Filler.getMaxBufferFloatsSize()));

        this.skyboxTexture = this.ut.upsertTexture(Texture.create(options.skyboxSource, { base: { data: [0,0,0,1] } })).source;

        this.ut.initSamplersArray(this.program, 'SAMPLER', 16);
    }

    draw(options: Parameters<typeof Filler.Info>[1]) {
        this.ut.upsertTexture(this.skyboxTexture);

        const buffer = Filler.Info(this.ut, options);

        this.ut.updateUniformBuffer(this.locations.ubo.Info, buffer);
        this.ut.gl.drawArrays(this.ut.gl.TRIANGLE_STRIP, 0, 4);

        return this;
    }
}

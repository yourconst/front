import type { Gl2Utils, TextureConfig } from '../../../../helpers/webgl';
import { Gl2Program } from '../../../../helpers/webgl/Program';
import vertexSource from './index.vert?raw';
import fragmentSource from './index.frag?raw';

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

export class Image2dProgram extends Gl2Program<'position', 'sampler'> {
    static createWithEmptyTexture(
        ut: Gl2Utils,
        options: Parameters<Gl2Utils['createEmptyTexture']>[0],
    ) {
        const texture = ut.createEmptyTexture(options);
        return new Image2dProgram(ut, texture);
    }

    constructor(ut: Gl2Utils, public texture: TextureConfig) {
        super(ut, {
            shaders: {
                vertex: [vertex.source],
                fragment: [fragment.source],
            },
            attributes: ['position'],
            uniforms: ['sampler'],
        });
    }

    use() {
        super.use();

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

        return this;
    }

    draw() {
        this.ut.gl.uniform1i(
            this.locations.uniform.sampler,
            this.ut.getTextureIndex(this.texture),
        );
        // this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture.texture);
        this.ut.gl.drawArrays(this.ut.gl.TRIANGLE_STRIP, 0, 4);
    }
}

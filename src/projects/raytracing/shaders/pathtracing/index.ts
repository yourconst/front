import vertexSource from '../standard.vert?raw';
import fragmentSource from './index.frag?raw';
import type { Gl2Utils, TextureConfig } from '../../../../helpers/webgl';
import { Gl2Program } from '../../../../helpers/webgl/Program';
import { Filler } from './filler';
import { Texture, type RawTextureSource } from '../../../../libs/render/Texture';
import { Image2dProgram } from '../image2d';

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

export class PathtracingProgram extends Gl2Program<'position', 'SAMPLER', 'Info'> {
    readonly filler = Filler;
    private frameBuffer: WebGLFramebuffer;
    private frames: [TextureConfig, TextureConfig];
    private frameProgram: Image2dProgram;
    skyboxTexture: TextureConfig;
    private ubo: Float32Array;

    private readonly sampling = {
        enabled: false,
        iter: 0,
    };

    constructor(ut: Gl2Utils, options: {
        skyboxSource: RawTextureSource,
    }) {
        super(ut, {
            shaders: {
                vertex: [vertexSource],
                fragment: [fragmentSource],
            },
            attributes: ['position'],
            ubos: ['Info'],
            uniforms: ['SAMPLER'],
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
        this.ubo = new Float32Array(Filler.getMaxBufferFloatsSize());
        this.ut.bufferData(this.locations.ubo.Info, this.ubo);

        this.skyboxTexture = this.ut.upsertTexture(Texture.create(options.skyboxSource, { base: { data: [0,0,0,1] } })).source;

        // this.ut.initSamplersArray(this.program, 'SAMPLER', 16);

        this.frameBuffer = this.ut.gl.createFramebuffer();

        this.frames = [
            this.ut.createEmptyTexture({ width: this.ut.gl.drawingBufferWidth, height: this.ut.gl.drawingBufferHeight }),
            this.ut.createEmptyTexture({ width: this.ut.gl.drawingBufferWidth, height: this.ut.gl.drawingBufferHeight }),
        ];

        this.frameProgram = new Image2dProgram(ut, this.frames[0]);
    }

    samplingStart() {
        this.sampling.enabled = true;
        this.sampling.iter = 0;
        return this;
    }

    samplingStop() {
        this.sampling.enabled = false;
        return this;
    }

    samplingGetPrevMultiplier() {
        if (!this.sampling.enabled) {
            return 0;
        }

        const res = this.sampling.iter / (this.sampling.iter + 1);
        ++this.sampling.iter;
        // return Math.min(3, this.sampling.iter);
        return res;
    }

    updateResolution() {
        this.ut.updateTexture(this.frames[0], {
            width: this.ut.gl.drawingBufferWidth, height: this.ut.gl.drawingBufferHeight,
        });
        this.ut.updateTexture(this.frames[1], {
            width: this.ut.gl.drawingBufferWidth, height: this.ut.gl.drawingBufferHeight,
        });
    }

    use() {
        super.use();
        
        this.ut.gl.enableVertexAttribArray(this.locations.attribute.position);
        // this.ut.bufferData(this.locations.ubo.Info, this.ubo);

        return this;
    }

    draw(options: Parameters<typeof Filler.Info>[2]) {
        this.use();
        this.ut.rebindTextures();
        this.ut.beginFrameBinding();

        this.ut.getFrameTextureIndex(this.skyboxTexture);
        this.ut.getFrameTextureIndex(this.frames[0]);

        const offset = Filler.Info(this.ut, this.ubo, options, this.samplingGetPrevMultiplier());

        const { gl } = this;

        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frames[1].texture, 0);

        // this.ut.bufferData(this.locations.ubo.Info, this.ubo);
        this.ut.updateUniformBuffer(this.locations.ubo.Info, this.ubo.buffer.slice(0, 4 * offset));

        this.ut.endFrameBinding(this.locations.uniform.SAMPLER, 16);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.frameProgram.texture = this.frames[1];
        this.frameProgram.use().draw();

        this.frames.reverse();

        return this;
    }
}

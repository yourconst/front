import { Vector2 } from "../../libs/math/Vector2";
import { Vector4 } from "../../libs/math/Vector4";
import type { Texture } from "../../libs/render/Texture";
import { Helpers } from "../common";

type Gl2ShaderType = WebGL2RenderingContext['VERTEX_SHADER'] |
    WebGL2RenderingContext['FRAGMENT_SHADER'];

type TEXTURE_INDEX =
    0|1|2|3|4|5|6|7|8|9|
    10|11|12|13|14|15|16|17|18|19|
    20|21|22|23|24|25|26|27|28|29|
    30|31;

interface TextureConfig {
    readonly source: Texture;
    readonly mipMap: boolean;
    readonly type: number;
    readonly texture: WebGLTexture;
    readonly level: number;
    readonly internalFormat: number;
    readonly border: number;
    readonly srcFormat: number;
    readonly srcType: number;
}

export class Gl2Utils<TextureName extends string = null> {
    private readonly textures = new Set<TextureConfig>();

    constructor(public gl: WebGL2RenderingContext) { }


    compileShader(source: string, type: Gl2ShaderType) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source.trim());
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.log(this.gl.getShaderInfoLog(shader));
            throw "Shader compile failed with: " + this.gl.getShaderInfoLog(shader);
        }

        // alert('Compiled');

        return shader;
    }

    createProgram(options = {
        shaders: <WebGLShader[]>[],
        use: true,
    }) {
        const program = this.gl.createProgram();

        if (options.shaders) {
            for (const shader of options.shaders) {
                this.gl.attachShader(program, shader);
            }
        }

        this.gl.linkProgram(program);

        if (options.use) {
            this.gl.useProgram(program);
        }

        return program;
    }

    getAttribLocation(program: WebGLProgram, name: string) {
        const attributeLocation = this.gl.getAttribLocation(program, name);
        if (attributeLocation === -1) {
          throw new Error("Cannot find attribute " + name + ".");
        }
        return attributeLocation;
    }

    getUniformLocation(program: WebGLProgram, name: string) {
        const attributeLocation = this.gl.getUniformLocation(program, name);
        if (attributeLocation === -1) {
          throw new Error("Cannot find uniform " + name + ".");
        }
        return attributeLocation;
    }

    bindBuffer(buffer: BufferSource, usage = this.gl.STATIC_DRAW) {
        const glBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, glBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, usage);

        return glBuffer;
    }

    getUniformBuffer(program: WebGLProgram, name: string, buffer: BufferSource) {
        const boundLocation = this.gl.getUniformBlockIndex(program, name);

        const glBuffer = this.gl.createBuffer();
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, boundLocation, glBuffer);

        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, glBuffer);
        this.gl.bufferData(this.gl.UNIFORM_BUFFER, buffer, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);

        return glBuffer;
    }

    updateUniformBuffer(glBuffer: WebGLBuffer, buffer: BufferSource) {
        // console.log(glBuffer, buffer);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, glBuffer);
        this.gl.bufferData(this.gl.UNIFORM_BUFFER, buffer, this.gl.DYNAMIC_DRAW);
        // this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, <any> buffer, 0, 16);
        // this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
    }

    createTexture(options: {
        source: Texture;
        mipMap?: boolean;
    }) {
        options.mipMap ??= false;

        const type = this.gl.TEXTURE_2D;
        const texture = this.gl.createTexture();
        this.gl.bindTexture(type, texture);

        const config: TextureConfig = {
            source: options.source,
            type,
            texture,
            level: 0,
            internalFormat: this.gl.RGBA,
            border: 0,
            srcFormat: this.gl.RGBA,
            srcType: this.gl.UNSIGNED_BYTE,
            mipMap: options.mipMap,
        };

        const pixel = config.srcType === this.gl.UNSIGNED_BYTE ?
            options.source.baseColor.getNormBytes() :
            options.source.baseColor.getNormFloats();

        this.gl.texImage2D(
            config.type,
            config.level,
            config.internalFormat,
            1, // config.source.width,
            1, // config.source.height,
            config.border,
            config.srcFormat,
            config.srcType,
            pixel,
        );

        this.textures.add(config);

        return config;
    }

    async loadTexture(config: TextureConfig) {
        await config.source.load();
        
        // console.log(config.source.width, config.source.height, config);

        this.gl.bindTexture(config.type, config.texture);
        this.gl.texImage2D(
            config.type,
            config.level,
            config.internalFormat,
            config.srcFormat,
            config.srcType,
            config.source.canvas,
        );
        
        // console.log(config.source);
        
        if (config.mipMap && config.source.isSizesPow2()) {
            this.gl.generateMipmap(config.type);
        } else {
            this.gl.texParameteri(config.type, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(config.type, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            // this.gl.texParameteri(config.type, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(config.type, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

            // glTexParameterf(GL_TEXTURE_RECTANGLE_ARB, GL_TEXTURE_WRAP_S, GL_CLAMP); 
            // glTexParameterf(GL_TEXTURE_RECTANGLE_ARB, GL_TEXTURE_WRAP_T, GL_CLAMP);
        }
    }

    bindTexture(config: TextureConfig) {
        this.gl.activeTexture(this.gl[`TEXTURE${config.source.index}`]);
        this.gl.bindTexture(config.type, config.texture);
    }

    rebindTextures() {
        for (const config of this.textures) {
            this.bindTexture(config);
        }
    }

    async * createLoadBindTextures(list: Texture[], options?: {
        program: WebGLProgram;
        samplersNamePrefix: string;
        maxWidth?: number;
        maxHeight?: number;
        mipMap?: boolean
    }) {
        if (list.length + this.getTexturesCount() > 32) {
            throw new Error(
                `Too many textures (${list.length} + ${this.getTexturesCount()}). Max: 32`,
            );
        }

        if (options) {
            this.initSamplersArray(options.program, options.samplersNamePrefix, 32);
        }

        for (const source of list) {
            source.options.maxWidth = Math.min(
                source.options.maxWidth || options.maxWidth,
                options.maxWidth || source.options.maxWidth,
            ) || undefined;
            source.options.maxHeight = Math.min(
                source.options.maxHeight || options.maxHeight,
                options.maxHeight || source.options.maxHeight,
            ) || undefined;

            const config = this.createTexture({
                source,
                mipMap: options.mipMap,
            });

            yield config;

            await this.loadTexture(config);
            // this.bindTexture(config);

            // TODO: try to understand
            this.rebindTextures();
        }
    }

    getTexturesCount() {
        return this.textures.size;
    }

    // TODO: remove
    initSamplersArray(program: WebGLProgram, prefix: string, count: TEXTURE_INDEX | 32 = <any> this.getTexturesCount()) {
        count = <TEXTURE_INDEX | 32> (count >> 0);

        if (count < 1 || 32 < count) {
            throw new Error();
        }

        const location = this.getUniformLocation(program, prefix);
        this.gl.uniform1iv(location, new Array(count).fill(0).map((_, i) => i));

        // for (let i = 0; i < count; ++i) {
        //     const location = this.getUniformLocation(program, `${prefix}[${i}]`);
        //     this.gl.uniform1i(location, i);
        // }
    }


    readPixelsUV(offset: Vector2, sizes: Vector2) {
        const rsz = new Vector2(this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

        offset = offset.clone().multiply(rsz).trunc();
        sizes = sizes.clone().multiply(rsz).trunc();
        
        const pixelSize = 4;
        const pixelsCount = sizes.rectSquare();
        const data = new Uint8Array(pixelSize * pixelsCount);

        this.gl.readPixels(
            offset.x, offset.y,
            sizes.x, sizes.y,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            data,
        );

        return { offset, sizes, pixelsCount, pixelSize, data };
    }
}

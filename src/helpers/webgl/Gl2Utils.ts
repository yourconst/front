import { Vector2 } from "../../libs/math/Vector2";
import { Vector4 } from "../../libs/math/Vector4";
import { Texture } from "../../libs/render/Texture";
import { Helpers } from "../common";
import { Gl2Program, type Gl2ProgramOptions } from "./Program";

type Gl2ShaderType = WebGL2RenderingContext['VERTEX_SHADER'] |
    WebGL2RenderingContext['FRAGMENT_SHADER'];

type TEXTURE_INDEX =
    0|1|2|3|4|5|6|7|8|9|
    10|11|12|13|14|15|16|17|18|19|
    20|21|22|23|24|25|26|27|28|29|
    30|31;
    
type BufferType = WebGL2RenderingContext['ARRAY_BUFFER'] |
    WebGL2RenderingContext['UNIFORM_BUFFER'];

type BufferUsage = WebGL2RenderingContext['STATIC_DRAW'] |
    WebGL2RenderingContext['DYNAMIC_DRAW'] |
    WebGL2RenderingContext['DYNAMIC_READ'] |
    WebGL2RenderingContext['DYNAMIC_COPY'];

type TextureSource = string | Texture;

export interface TextureConfig {
    index?: number;
    readonly source: TextureSource;
    loadedHash: number;
    readonly mipMap: boolean;
    readonly type: number;
    readonly texture: WebGLTexture;
    readonly level: number;
    readonly internalFormat: number;
    readonly border: number;
    readonly srcFormat: number;
    readonly srcType: number;
}

export class Gl2Utils {
    private readonly maxTexturesCount: number;
    private readonly textures = new Map<TextureSource, TextureConfig>();
    private readonly texturesByIndexes = new Map<number, TextureConfig>();
    private readonly texturesIndexesEmpty = new Set<number>();
    readonly programs = new Set<Gl2Program<any>>();
    private _activeProgram?: Gl2Program<any>;

    constructor(public gl: WebGL2RenderingContext) {
        this.maxTexturesCount = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
        this.clearTexturesBindings();
    }

    destroy() {
        for (const t of this.textures.values()) {
            this.gl.deleteTexture(t.texture);
        }
        this.textures.clear();

        for (const p of this.programs) {
            p.destroy();
        }
        this.programs.clear();

        this.gl = null;
    }

    useProgram(program: Gl2Program<any>) {
        if (this._activeProgram === program) {
            return this;
        }

        this._activeProgram = program;

        this.gl.useProgram(this._activeProgram?.program);

        return this;
    }

    createGl2Program<
        Attributes extends string,
        Uniforms extends string = null,
        UBOs extends string = null
    >(options: Gl2ProgramOptions<Attributes, Uniforms, UBOs>) {
        return <Gl2Program<Attributes, Uniforms, UBOs>> new Gl2Program(this, options);
    }


    compileShader(source: string, type: Gl2ShaderType) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source.trim());
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            console.log(info);
            throw new Error("Shader compile failed with: " + info);
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

    bufferData(
        glBuffer: WebGLBuffer, buffer: BufferSource,
        type: BufferType = this.gl.UNIFORM_BUFFER,
        usage: BufferUsage = this.gl.DYNAMIC_DRAW,
    ) {
        this.gl.bindBuffer(type, glBuffer);
        this.gl.bufferData(type, buffer, usage);
        return this;
    }

    createBufferAndData(
        buffer: BufferSource,
        type: BufferType = this.gl.ARRAY_BUFFER,
        usage: BufferUsage = this.gl.STATIC_DRAW,
    ) {
        const glBuffer = this.gl.createBuffer();
        this.bufferData(glBuffer, buffer, type, usage);
        return glBuffer;
    }

    getUniformBuffer(program: WebGLProgram, name: string, buffer?: BufferSource) {
        const boundLocation = this.gl.getUniformBlockIndex(program, name);

        const glBuffer = this.gl.createBuffer();
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, boundLocation, glBuffer);

        if (buffer) {
            this.bufferData(glBuffer, buffer, this.gl.UNIFORM_BUFFER, this.gl.DYNAMIC_DRAW);
            // this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
        }

        return glBuffer;
    }

    updateUniformBuffer(glBuffer: WebGLBuffer, buffer: BufferSource, dstOffset = 0) {
        // console.log(glBuffer, buffer);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, glBuffer);
        // this.gl.bufferData(this.gl.UNIFORM_BUFFER, buffer, this.gl.DYNAMIC_DRAW);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, dstOffset, buffer);
        // this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
    }
    
    updateTexture(config: TextureConfig, options: {
        width: number;
        height: number;
        data?: ArrayBufferView;
        // mipMap?: boolean;
    }) {
        this.gl.bindTexture(config.type, config.texture);
        this.gl.texImage2D(
            config.type,
            config.level,
            config.internalFormat,
            options.width,
            options.height,
            config.border,
            config.srcFormat,
            config.srcType,
            options.data,
        );
    }

    createEmptyTexture(options: {
        width: number;
        height: number;
        mipMap?: boolean;
    }) {
        const type = this.gl.TEXTURE_2D;
        const texture = this.gl.createTexture();

        const config: TextureConfig = {
            source: Math.random().toString(16).slice(2),
            loadedHash: null,
            type,
            texture,
            level: 0,
            internalFormat: this.gl.RGBA,
            border: 0,
            srcFormat: this.gl.RGBA,
            srcType: this.gl.UNSIGNED_BYTE,
            mipMap: options?.mipMap ?? false,
        };

        this.textures.set(config.source, config);

        this.updateTexture(config, options);
            
        if (config.mipMap && Helpers.isPow2(options.width) && Helpers.isPow2(options.height)) {
            this.gl.generateMipmap(config.type);
        } else {
            // this.gl.texParameteri(config.type, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            // this.gl.texParameteri(config.type, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            // this.gl.texParameteri(config.type, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(config.type, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(config.type, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        }

        return config;
    }

    upsertTexture(source: Texture, options?: {
        mipMap?: boolean;
    }) {
        let config = this.textures.get(source);

        if (!config) {
            const texture = this.gl.createTexture();

            config = {
                source,
                loadedHash: -1,
                type: this.gl.TEXTURE_2D,
                texture,
                level: 0,
                internalFormat: this.gl.RGBA,
                border: 0,
                srcFormat: this.gl.RGBA,
                srcType: this.gl.UNSIGNED_BYTE,
                mipMap: options?.mipMap ?? false,
            };

            this.textures.set(config.source, config);

            this.updateTexture(config, {
                data: new Uint8Array([128, 128, 128, 255]),
                width: 1, height: 1,
            });
        }

        if (!(config.source instanceof Texture)) {
            throw new Error();
        }

        if (!config.source.loaded) {
            config.source.load();
        }

        if (config.loadedHash !== config.source.hash) {
            config.loadedHash = config.source.hash;
            this.gl.bindTexture(config.type, config.texture);
            this.gl.texImage2D(
                config.type,
                config.level,
                config.internalFormat,
                config.srcFormat,
                config.srcType,
                config.source.canvas,
            );
            
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
            this.gl.bindTexture(config.type, null);

            console.log('Load', config.source.rawSource);
        }

        return config;
    }
    
    private frameTexturesIndexes = new Map<TextureConfig, number>();
    beginFrameBinding() {
        this.frameTexturesIndexes.clear();
        return this;
    }

    endFrameBinding(
        samplersLocation: WebGLUniformLocation,
        maxCount = this.maxTexturesCount,
    ) {
        const sa = new Array(maxCount).fill(0);

        for (const [config, ti] of this.frameTexturesIndexes) {
            sa[ti] = config.index;
        }

        this.gl.uniform1iv(samplersLocation, sa);
        return this;
    }

    getTextureIndex(source: Texture | TextureConfig) {
        if (!source) {
            return -1;
        }

        let config: TextureConfig;
        if (source instanceof Texture) {
            config = this.upsertTexture(source);
        } else {
            config = source;
        }

        return this.tryBindTexture(config);
    }

    getFrameTextureIndex(source: Texture | TextureConfig) {
        if (!source) {
            return -1;
        }

        let config: TextureConfig;
        if (source instanceof Texture) {
            config = this.upsertTexture(source);
        } else {
            config = source;
        }

        let ti = this.frameTexturesIndexes.get(config) ?? -1;

        if (ti !== -1) {
            return ti;
        }

        const index = this.tryBindTexture(config);
        if (index !== -1) {
            ti = this.frameTexturesIndexes.size;
            this.frameTexturesIndexes.set(config, ti);
        }

        return ti;
    }

    rebindTextures() {
        for (const config of this.textures.values()) {
            const index = config.index;
            if (typeof index === 'number') {
                config.index = null;
                this.tryBindTexture(config, index);
            }
        }

        return this;
    }

    tryBindTexture(config: TextureConfig, index?: number) {
        index ??= config.index ?? this.texturesIndexesEmpty.values().next().value;

        if (typeof index !== 'number') {
            console.warn(
                `Too many textures for single draw call (max - ${this.maxTexturesCount}`,
                config,
            );
            return -1;
        }

        if (this.maxTexturesCount <= index) {
            throw new Error(`Too big texture index (max - ${this.maxTexturesCount - 1}`);
        }

        if (index === config.index) {
            return index;
        } else {
            this.unbindTexture(config);
        }

        // console.log('Bind', config.source['rawSource']);

        this.gl.activeTexture(this.gl[`TEXTURE${index}`]);
        this.gl.bindTexture(config.type, config.texture);
        // this.gl.activeTexture(null);
        config.index = index;
        this.texturesIndexesEmpty.delete(index);
        this.texturesByIndexes.set(index, config);
        return index;
    }

    unbindTexture(config: TextureConfig) {
        if (typeof config.index !== 'number') {
            return this;
        }

        this.gl.activeTexture(this.gl[`TEXTURE${config.index}`]);
        this.gl.bindTexture(config.type, null);
        // this.gl.activeTexture(null);

        this.texturesIndexesEmpty.add(config.index);
        this.texturesByIndexes.delete(config.index);
        config.index = null;

        return this;
    }

    clearTexturesBindings() {
        for (const config of this.textures.values()) {
            this.unbindTexture(config);
        }

        for (let i = 0; i < this.maxTexturesCount; ++i) {
            this.texturesIndexesEmpty.add(i);
        }

        return this;
    }

    async * createLoadBindTextures(list: Texture[], options?: {
        maxWidth?: number;
        maxHeight?: number;
        mipMap?: boolean
    }) {
        for (const source of list) {
            source.maxWidth = Math.min(
                source.maxWidth || options.maxWidth,
                options.maxWidth || source.maxWidth,
            ) || undefined;
            source.maxHeight = Math.min(
                source.maxHeight || options.maxHeight,
                options.maxHeight || source.maxHeight,
            ) || undefined;

            const config = this.upsertTexture(source, { mipMap: options.mipMap });

            yield config;

            await source.load();

            await this.upsertTexture(source);
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

import { Vector4 } from "../../libs/math/Vector4";
import { Helpers } from "../common";

type Gl2ShaderType = WebGL2RenderingContext['VERTEX_SHADER'] |
    WebGL2RenderingContext['FRAGMENT_SHADER'];

type TEXTURE_INDEX =
    0|1|2|3|4|5|6|7|8|9|
    10|11|12|13|14|15|16|17|18|19|
    20|21|22|23|24|25|26|27|28|29|
    30|31;

interface TextureConfig<TextureName extends string> {
    readonly name: TextureName;
    readonly index: TEXTURE_INDEX;
    readonly type: number;
    readonly texture: WebGLTexture;
    readonly level: number;
    readonly internalFormat: number;
    readonly border: number;
    readonly srcFormat: number;
    readonly srcType: number;
    readonly mipMap: boolean;
    width: number;
    height: number;
    readonly maxWidth?: number;
    readonly maxHeight?: number;
}

export class Gl2Utils<TextureName extends string = null> {
    private readonly texturesMap = new Map<TextureName, TextureConfig<TextureName>>();

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
        name: TextureName;
        baseColor?: Vector4;
        mipMap?: boolean;
        maxWidth?: number;
        maxHeight?: number;
    }) {
        options.baseColor ??= new Vector4(0.5, 0.5, 0.5, 1.0);
        options.mipMap ??= false;

        const type = this.gl.TEXTURE_2D;
        const texture = this.gl.createTexture();
        this.gl.bindTexture(type, texture);

        const config: TextureConfig<TextureName> = {
            name: options.name,
            index: this.getTextureIndex(options.name),
            type,
            texture,
            level: 0,
            internalFormat: this.gl.RGBA,
            width: 1,
            height: 1,
            border: 0,
            srcFormat: this.gl.RGBA,
            srcType: this.gl.UNSIGNED_BYTE,
            mipMap: options.mipMap,
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
        };

        const pixel = config.srcType === this.gl.UNSIGNED_BYTE ?
            options.baseColor.getNormBytes() :
            options.baseColor.getNormFloats();

        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            config.level,
            config.internalFormat,
            config.width,
            config.height,
            config.border,
            config.srcFormat,
            config.srcType,
            pixel
        );

        this.texturesMap.set(config.name, config);

        return config;
    }

    async loadTexture(config: TextureConfig<TextureName>, url: string) {
        const promise = new Helpers.PromiseManaged<TextureConfig<TextureName>>();

        const image = new Image();
        // image.crossOrigin = "anonymous";

        image.onload = () => {
            let source: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas = image;

            if (config.maxWidth && config.maxHeight && (
                image.width > config.maxWidth ||
                image.height > config.maxHeight
            )) {
                const factor = Math.max(
                    image.width / config.maxWidth,
                    image.height / config.maxHeight,
                );

                const canvas = Helpers.createOffscreenCanvas(
                    (image.width / factor) >> 0,
                    (image.height / factor) >> 0,
                );

                canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);

                source = canvas;
            }

            config.width = source.width;
            config.height = source.height;

            this.gl.bindTexture(config.type, config.texture);
            this.gl.texImage2D(
                config.type,
                config.level,
                config.internalFormat,
                config.srcFormat,
                config.srcType,
                source,
            );
            
            if (config.mipMap && Helpers.isPow2(image.width) && Helpers.isPow2(image.height)) {
                this.gl.generateMipmap(config.type);
            } else {
                this.gl.texParameteri(config.type, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(config.type, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                // this.gl.texParameteri(config.type, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
                this.gl.texParameteri(config.type, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

                // glTexParameterf(GL_TEXTURE_RECTANGLE_ARB, GL_TEXTURE_WRAP_S, GL_CLAMP); 
                // glTexParameterf(GL_TEXTURE_RECTANGLE_ARB, GL_TEXTURE_WRAP_T, GL_CLAMP);
            }

            promise.resolve(config);
        };

        image.onerror = (error) => {
            alert(error);
            promise.reject(error);
        };

        image.src = url;

        return promise.promise;
    }

    bindTexture(config: TextureConfig<TextureName>) {
        if (!config.texture) {
            return;
        }

        this.gl.activeTexture(this.gl[`TEXTURE${config.index}`]);
        this.gl.bindTexture(config.type, config.texture);
    }

    rebindTextures() {
        for (const config of this.texturesMap.values()) {
            this.bindTexture(config);
        }
    }

    async createLoadBindTextures(dict: Record<TextureName, string>, options?: {
        program: WebGLProgram;
        samplersNamePrefix: string;
        maxWidth?: number;
        maxHeight?: number;
    }) {
        // TODO: remove
        return;
        const entries: [TextureName, string][] = <any> Object.entries(dict);
        
        if (entries.length + this.getTexturesCount() > 32) {
            throw new Error(
                `Too many textures (${entries.length} + ${this.getTexturesCount()}). Max: 32`,
            );
        }

        if (options) {
            this.initSamplersArray(options.program, options.samplersNamePrefix, 32);
        }

        for (const [name, url] of entries) {
            const config = this.createTexture({
                name,
                maxWidth: options?.maxWidth,
                maxHeight: options?.maxHeight,
            });

            await this.loadTexture(config, url);
            // this.bindTexture(config);

            // TODO: try to understand
            this.rebindTextures();
        }
    }

    getTextureIndex(name: TextureName) {
        // TODO: remove
        return -1;
        const config = this.texturesMap.get(name);

        if (!config) {
            const index = <TEXTURE_INDEX> this.getTexturesCount();
            this.texturesMap.set(name, <any>{ index });
            
            return index;
        }

        return config.index;
    }

    reserveTextureIndex(name: TextureName, index: number) {
        // TODO: remove
        return -1;
        const existingConfig = this.texturesMap.get(name);

        if (existingConfig && existingConfig.index !== index) {
            throw new Error(`Texture '${name}' already exists with other index ${index}`);
        }

        if (this.texturesMap.size !== index) {
            throw new Error(`Cannot bind texture '${name}' to index ${index}`);
        }

        return this.getTextureIndex(name);
    }

    getTexturesIndexes() {
        return <Record<TextureName, TEXTURE_INDEX>> Object.fromEntries(
            [...this.texturesMap.entries()].map(e => [e[0], e[1].index]),
        );
    }

    getRandomTextureIndex(from = 0) {
        return Helpers.randInt(this.getTexturesCount(), from);
    }

    getModuloNextTextureIndex(objectsCount: number, excludeFirst = 0) {
        const base = this.getTexturesCount() - excludeFirst;
        const result = excludeFirst + (objectsCount % base);

        if (result < 0 || this.getTexturesCount() < result) {
            return -1;
        }

        return result;
    }

    getTexturesCount() {
        return this.texturesMap.size;
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
}

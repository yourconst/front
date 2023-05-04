import { Helpers } from "../../helpers/common";
import type { Vector2 } from "../math/Vector2";
import { Vector4 } from "../math/Vector4";

export type RealRawTextureSource = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;

export type RawTextureSource = string | RealRawTextureSource;

export interface TextureOptions {
    baseColor?: Vector4;
    maxWidth?: number;
    maxHeight?: number;
    index?: number;
}

export class Texture {
    private static readonly cache = new Map<RawTextureSource, Texture>();
    private static readonly indexesCache: Texture[] = [];

    private static getNextIndex() {
        for (let i = 0; i < this.indexesCache.length; ++i) {
            if (!this.indexesCache[i]) {
                return i;
            }
        }

        return this.indexesCache.length;
    }

    private static isIndexFree(index: number) {
        return !this.indexesCache[index];
    }

    static clear() {
        this.cache.clear();
        this.indexesCache.length = 0;
    }

    private static broadcastedSimpleTexure?: Texture;
    static broadcastSimpleTexture() {
        const sz = 4;
        const canvas = Helpers.createOffscreenCanvas(sz, sz);
        const context = <CanvasRenderingContext2D> canvas.getContext('2d');
        const id = context.getImageData(0, 0, sz, sz);

        for (let i = 0; i < sz * sz; ++i) {
            const other = (i % 2) ^ ((i / sz) >> 0) % 2;
            id.data[4 * i + 0] = other ? 255 : 0;
            id.data[4 * i + 1] = other ? 0 : 255;
            id.data[4 * i + 2] = 127;
            id.data[4 * i + 3] = 255;
        }

        context.putImageData(id, 0, 0);

        this.broadcastedSimpleTexure = this.create(canvas);
        return this;
    }

    static create(rawSource: RawTextureSource, options: TextureOptions = {}) {
        if (this.broadcastedSimpleTexure) {
            return this.broadcastedSimpleTexure;
        }

        let texture = this.cache.get(rawSource);

        if (!texture) {
            if (typeof options.index === 'number') {
                options.index >>= 0;
                if (options.index < 0 || 31 < options.index) {
                    console.log(options);
                    throw new Error();
                }
                if (!this.isIndexFree(options.index)) {
                    console.log(options);
                    throw new Error();
                }
            } else {
                options.index = this.getNextIndex();
            }

            texture = new Texture(rawSource, options);
            this.cache.set(rawSource, texture);
            this.indexesCache[texture.index] = texture;
        }

        return texture;
    }

    static getAll() {
        return [...this.cache.values()];
    }

    baseColor: Vector4;
    canvas?: OffscreenCanvas | HTMLCanvasElement;
    context2d?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    readonly index: number;

    private constructor(public readonly rawSource: RawTextureSource, public options: TextureOptions = {}) {
        if (!(
            typeof this.rawSource === 'string' ||
            this.rawSource instanceof HTMLImageElement ||
            this.rawSource instanceof OffscreenCanvas ||
            this.rawSource instanceof HTMLCanvasElement
        )) {
            throw new Error('Bad texture source', { cause: this.rawSource });
        }

        this.baseColor = this.options.baseColor || new Vector4(0.5, 0.5, 0.5, 1.0);
        this.index = options.index ?? -1;
    }

    get loaded() {
        return !!this.canvas;
    }

    get width() {
        return this.canvas?.width || 1;
    }

    get height() {
        return this.canvas?.height || 1;
    }

    isSizesPow2() {
        return Helpers.isPow2(this.width) && Helpers.isPow2(this.height);
    }
    
    async load() {
        if (this.loaded) {
            return this;
        }

        let realRawSource: RealRawTextureSource;
        let width: number;
        let height: number;

        if (typeof this.rawSource === 'string') {
            realRawSource = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();

                img.onload = () => resolve(img);
                img.onerror = (error) => reject(error);

                img.src = <string> this.rawSource;
            });

            width = realRawSource.naturalWidth;
            height = realRawSource.naturalHeight;
        } else
        if (this.rawSource instanceof HTMLImageElement) {
            realRawSource = this.rawSource;

            width = realRawSource.naturalWidth;
            height = realRawSource.naturalHeight;
        } else
        if (
            this.rawSource instanceof OffscreenCanvas ||
            this.rawSource instanceof HTMLCanvasElement
        ) {
            realRawSource = this.rawSource;

            width = realRawSource.width;
            height = realRawSource.height;
        }

        if ((this.options.maxWidth || this.options.maxHeight) && (
            width > this.options.maxWidth ||
            height > this.options.maxHeight
        )) {
            const factor = Math.max(
                width / (this.options.maxWidth || width),
                height / (this.options.maxHeight || height),
            );

            width = (width / factor) >> 0;
            height = (height / factor) >> 0;
        }

        this.canvas = Helpers.createOffscreenCanvas(width, height);
        this.context2d = <any> this.canvas.getContext('2d');
        this.context2d.drawImage(realRawSource, 0, 0, width, height);

        return this;
    }

    getPixelByUV(uv: Vector2) {
        uv = uv.clone();
        uv.x *= this.width;
        uv.y *= this.height;
        uv.trunc();
        const { data } = this.context2d.getImageData(uv.x, uv.y, 1, 1);
        
        return Vector4.createFromPixelUI8(...data);
    }
}

// Texture.broadcastSimpleTexture();
globalThis['Texture'] = Texture;

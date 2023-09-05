import { Helpers } from "../../helpers/common";
import type { ImageDataLike } from "../../helpers/common/Canvas";
import type { Vector2 } from "../math/Vector2";
import { Vector4 } from "../math/Vector4";

export type RealRawTextureSource = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;

export type RawTextureSource = string | RealRawTextureSource;

export interface TextureOptions {
    base?: ImageDataLike;
    maxWidth?: number;
    maxHeight?: number;
}

export class Texture {
    private static readonly cache = new Map<RawTextureSource, Texture>();

    static clear() {
        this.cache.clear();
    }

    private static broadcastedSimpleTexure?: Texture;
    static broadcastSimpleTexture() {
        const sz = 4;
        const data = new Uint8ClampedArray(sz * sz);

        for (let i = 0; i < sz * sz; ++i) {
            const other = (i % 2) ^ ((i / sz) >> 0) % 2;
            data[4 * i + 0] = other ? 255 : 0;
            data[4 * i + 1] = other ? 0 : 255;
            data[4 * i + 2] = 127;
            data[4 * i + 3] = 255;
        }

        const { canvas } = Helpers.Canvas.createWithData({ data, width: sz, height: sz });

        this.broadcastedSimpleTexure = this.create(canvas);
        return this;
    }

    static create(rawSource: RawTextureSource, options: TextureOptions = {}) {
        if (this.broadcastedSimpleTexure) {
            return this.broadcastedSimpleTexure;
        }

        let texture = this.cache.get(rawSource);

        if (!texture) {
            texture = new Texture(rawSource, options);
            this.cache.set(rawSource, texture);
        }

        return texture;
    }

    static getAll() {
        return [...this.cache.values()];
    }

    canvas: OffscreenCanvas | HTMLCanvasElement;
    context2d: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    private _loadingPromise = new Helpers.PromiseManaged<Texture>();
    maxWidth?: number;
    maxHeight?: number;
    
    hash = Math.random();

    private constructor(public readonly rawSource: RawTextureSource, options: TextureOptions = {}) {
        if (!(
            typeof this.rawSource === 'string' ||
            this.rawSource instanceof HTMLImageElement ||
            this.rawSource instanceof OffscreenCanvas ||
            this.rawSource instanceof HTMLCanvasElement
        )) {
            throw new Error('Bad texture source', { cause: this.rawSource });
        }

        this.maxWidth = options.maxWidth;
        this.maxHeight = options.maxHeight;
        
        const base = Helpers.Canvas.createWithData(
            options.base ?? { data: [0.5, 0.5, 0.5, 1], float: true },
        );

        this.canvas = base.canvas;
        this.context2d = base.context;
    }

    get loaded() {
        return !this._loadingPromise;
    }

    get loading() {
        return !!this._loadingPromise?._isStarted;
    }

    get width() {
        return this.canvas.width;
    }

    get height() {
        return this.canvas.height;
    }

    isSizesPow2() {
        return Helpers.isPow2(this.width) && Helpers.isPow2(this.height);
    }
    
    // TODO: rejecting
    async load() {
        // return this;
        if (this.loaded) {
            return this;
        }

        if (this.loading) {
            return this._loadingPromise.promise;
        }

        this._loadingPromise._isStarted = true;

        let realRawSource: RealRawTextureSource;
        let width: number;
        let height: number;

        if (typeof this.rawSource === 'string') {
            realRawSource = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';

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

        if ((this.maxWidth || this.maxHeight) && (
            width > this.maxWidth ||
            height > this.maxHeight
        )) {
            const factor = Math.max(
                width / (this.maxWidth || width),
                height / (this.maxHeight || height),
            );

            width = (width / factor) >> 0;
            height = (height / factor) >> 0;
        }

        this.canvas = Helpers.Canvas.createOffscreen(width, height);
        this.context2d = <any>this.canvas.getContext('2d');
        this.context2d.imageSmoothingEnabled = false;
        this.context2d.drawImage(realRawSource, 0, 0, width, height);
    
        this.hash = Math.random();

        const { _loadingPromise } = this;
        this._loadingPromise = null;
        _loadingPromise.resolve(this);
        return _loadingPromise.promise;
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

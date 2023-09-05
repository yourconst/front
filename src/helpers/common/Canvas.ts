export type ImageDataLike = ImageData | {
    data: Uint8ClampedArray | Array<number>;
    width?: number;
    height?: number;
    float?: boolean;
};

export abstract class CanvasHelpers {
    static create(width: number, height = width) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        return canvas;
    }

    static createOffscreen(width: number, height = width) {
        if (window.OffscreenCanvas) {
            return new OffscreenCanvas(width, height);
        }

        return CanvasHelpers.create(width, height);
    }

    static createWithData(idl: ImageDataLike) {
        const id = CanvasHelpers.getImageData(idl);
        const canvas = CanvasHelpers.createOffscreen(id.width, id.height);
        const context = <CanvasRenderingContext2D>canvas.getContext('2d');

        context.putImageData(id, 0, 0);
    
        return { canvas, context };
    }

    static createImageData(options: {
        data: Uint8ClampedArray;
        width?: number;
        height?: number;
    }) {
        if (!options.width && !options.height) {
            const sqrt = Math.sqrt(options.data.length >> 2) >> 0;
            options.width ??= sqrt;
            options.height ??= sqrt;
        } else if (!options.height) {
            options.height = (options.data.length / options.width) >> 0;
        } else if (!options.width) {
            options.width = (options.data.length / options.height) >> 0;
        }

        const id = new ImageData(
            options.data,
            options.width, options.height,
        );

        return id;
    }

    static getImageData(idl: ImageDataLike) {
        if (idl instanceof ImageData) {
            return idl;
        }

        if (idl.data instanceof Uint8ClampedArray) {
            return CanvasHelpers.createImageData(<any> idl);
        }

        return CanvasHelpers.createImageData({
            data: new Uint8ClampedArray(idl.float ? idl.data.map(v => 255 * v) : idl.data),
            width: idl.width,
            height: idl.height,
        });
    }
}

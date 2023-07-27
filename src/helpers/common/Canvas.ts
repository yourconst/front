export abstract class CanvasHelpers {
    static createOffscreen(width: number, height = width) {
        if (window.OffscreenCanvas) {
            return new OffscreenCanvas(width, height);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        return canvas;
    }
}

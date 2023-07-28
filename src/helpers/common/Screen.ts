import { Vector2 } from "../../libs/math/Vector2";

export abstract class ScreenHelpers {
    private static get screen() {
        return globalThis.screen;
    }

    static getPixelRatio() {
        return globalThis.devicePixelRatio || 1;
    }

    static getNativeResolution() {
        return new Vector2(this.screen.width, this.screen.height)
            .multiplyN(this.getPixelRatio());
    }

    static getWindowResolution() {
        return new Vector2(
            globalThis.document.documentElement.clientWidth,
            globalThis.document.documentElement.clientHeight,
        );
    }

    static getWindowNativeResolution() {
        return this.getWindowResolution()
            .multiplyN(this.getPixelRatio());
    }
}

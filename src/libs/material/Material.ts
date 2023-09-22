import type { Vector2 } from "../math/Vector2";
import type { Vector3 } from "../math/Vector3";
import type { Texture } from "../render/Texture";
import type { Color } from "./Color"

export interface MaterialOptions {
    color?: Color;
    colorMap?: Texture;
    light?: Color;
    specularity?: Color;
    specularityMap?: Texture;
    transparency?: number;
    transparencyMap?: Texture;
    refraction?: Vector3;
    normalMap?: Texture;
    uv?: {
        offset?: Vector2;
        scale?: Vector2;
    };
}

export class Material {
    color?: Color;
    colorMap?: Texture;
    light?: Color;
    specularity?: Color;
    specularityMap?: Texture;
    transparency?: number;
    transparencyMap?: Texture;
    refraction?: Vector3;
    normalMap?: Texture;
    uv?: {
        offset?: Vector2;
        scale?: Vector2;
    };
    
    constructor(options: MaterialOptions) {
        this.color = options.color;
        this.colorMap = options.colorMap;
        this.light = options.light;
        this.specularity = options.specularity;
        this.specularityMap = options.specularityMap;
        this.transparency = options.transparency;
        this.transparencyMap = options.transparencyMap;
        this.refraction = options.refraction;
        this.normalMap = options.normalMap;
    }

    getKey() {
        return `${this.color?.r}|${this.color?.g}|${this.color?.b}|${this.colorMap?.rawSource}|` +
            `${this.light?.r}|${this.light?.g}|${this.light?.b}|` +
            `${this.specularity?.r}|${this.specularity?.g}|${this.specularity?.b}|${this.specularityMap?.rawSource}|` +
            `${this.transparency}|${this.transparencyMap?.rawSource}|` +
            `${this.refraction?.x}|${this.refraction?.y}|${this.refraction?.z}|` +
            `${this.normalMap?.rawSource}|${this.uv?.offset?.x}|${this.uv?.offset?.y}|${this.uv?.scale?.x}|${this.uv?.scale?.y}`;
    }

    clone() {
        return new Material({
            color: this.color,
            light: this.light,
            specularity: this.specularity,
            transparency: this.transparency,
            normalMap: this.normalMap,
        });
    }
}

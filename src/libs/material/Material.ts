import type { Texture } from "../render/Texture";
import type { Color } from "./Color"

export interface MaterialOptions {
    color: Color;
    texture?: Texture;
    reflectance?: Texture;
    specularity?: Texture;
    transparency?: Texture;
    normalMap?: Texture;
}

export class Material {
    color: Color;
    texture?: Texture;
    reflectance?: Texture;
    specularity?: Texture;
    transparency?: Texture;
    normalMap?: Texture;
    
    constructor(options: MaterialOptions) {
        this.color = options.color;
        this.texture = options.texture;
        this.reflectance = options.reflectance;
        this.specularity = options.specularity;
        this.transparency = options.transparency;
        this.normalMap = options.normalMap;
    }

    clone() {
        return new Material({
            color: this.color,
            texture: this.texture,
            reflectance: this.reflectance,
            specularity: this.specularity,
            transparency: this.transparency,
            normalMap: this.normalMap,
        });
    }
}

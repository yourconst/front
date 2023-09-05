import { TEXTURES } from ".";
import { Color } from "../../../libs/material/Color";
import { Material } from "../../../libs/material/Material";
import { Texture } from "../../../libs/render/Texture";

export const MATERIALS = {
    space: new Material({ color: Color.create(0), texture: Texture.create(TEXTURES.space) }),
    sun: new Material({ color: Color.create(1e6,1e6,1e6), texture: Texture.create(TEXTURES.sun) }),
    mercury: new Material({ color: Color.create(1,1,1), texture: Texture.create(TEXTURES.mercury) }),
    venus: new Material({ color: Color.create(1,1,1), texture: Texture.create(TEXTURES.venus) }),
    earth: new Material({
        color: Color.create(1,1,1),
        texture: Texture.create(TEXTURES.earth),
        normalMap: Texture.create(TEXTURES.earthNormalMap),
        reflectance: Texture.create(TEXTURES.earthSpecularMap),
    }),
    moon: new Material({ color: Color.create(1,1,1), texture: Texture.create(TEXTURES.moon) }),
    mars: new Material({ color: Color.create(1,1,1), texture: Texture.create(TEXTURES.mars) }),
    jupiter: new Material({ color: Color.create(1,1,1), texture: Texture.create(TEXTURES.jupiter) }),
    saturn: new Material({ color: Color.create(1,1,1), texture: Texture.create(TEXTURES.saturn) }),
    uranus: new Material({ color: Color.create(1,1,1), texture: Texture.create(TEXTURES.uranus) }),
    neptune: new Material({ color: Color.create(1,1,1), texture: Texture.create(TEXTURES.neptune) }),
};

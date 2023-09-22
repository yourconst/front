import { TEXTURES } from ".";
import { Color } from "../../../libs/material/Color";
import { Material } from "../../../libs/material/Material";
import { Texture } from "../../../libs/render/Texture";

export const MATERIALS = {
    space: new Material({ colorMap: Texture.create(TEXTURES.space) }),
    sun: new Material({ colorMap: Texture.create(TEXTURES.sun), light: Color.create(1e7,1e7,1e7) }),
    mercury: new Material({ colorMap: Texture.create(TEXTURES.mercury) }),
    venus: new Material({ colorMap: Texture.create(TEXTURES.venus) }),
    earth: new Material({
        colorMap: Texture.create(TEXTURES.earth),
        normalMap: Texture.create(TEXTURES.earthNormalMap),
        specularityMap: Texture.create(TEXTURES.earthSpecularMap),
    }),
    moon: new Material({ colorMap: Texture.create(TEXTURES.moon), normalMap: Texture.create(TEXTURES.testNormal) }),
    mars: new Material({ colorMap: Texture.create(TEXTURES.mars), normalMap: Texture.create(TEXTURES.testNormal) }),
    jupiter: new Material({ colorMap: Texture.create(TEXTURES.jupiter), normalMap: Texture.create(TEXTURES.testNormal) }),
    saturn: new Material({ colorMap: Texture.create(TEXTURES.saturn), normalMap: Texture.create(TEXTURES.testNormal) }),
    uranus: new Material({ colorMap: Texture.create(TEXTURES.uranus), normalMap: Texture.create(TEXTURES.testNormal) }),
    neptune: new Material({ colorMap: Texture.create(TEXTURES.neptune), normalMap: Texture.create(TEXTURES.testNormal) }),
    // test: new Material({ normalMap: Texture.create(TEXTURES.testNormal) }),
};

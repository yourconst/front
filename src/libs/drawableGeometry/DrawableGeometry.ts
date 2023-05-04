import type { Geometry3 } from "../geometry/Geometry3";
import type { Vector3 } from "../math/Vector3";
import type { Texture } from "../render/Texture";

export interface IDrawableGeometryOptions {
    color: Vector3;
    texture?: Texture;
}

export interface IDrawableGeometry extends Geometry3, IDrawableGeometryOptions {
    
}

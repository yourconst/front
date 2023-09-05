import type { Geometry3 } from "../geometry/Geometry3";
import type { Material } from "../material/Material";

export interface IDrawableGeometryOptions {
    material: Material;
}

export interface IDrawableGeometry extends Geometry3, IDrawableGeometryOptions {
    
}

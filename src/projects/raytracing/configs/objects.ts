import { DrawableSphere } from "../../../libs/drawableGeometry/DrawableSphere";
import { Vector3 } from "../../../libs/math/Vector3";
import { RigidBody3 } from "../../../libs/physics/RigidBody3";
import type { TextureName } from '../textures';

export const OBJECTS = {
    stars: [
        new RigidBody3({
            geometry: new DrawableSphere<TextureName>({
                center: new Vector3(0, 0, 149_600_000_00/* 149_600_000_000 */),
                radius: 696_340_000,
                color: new Vector3(1, 1, 1).multiplyN(8e1),
                textureName: 'sun',
            }),
            mass: 1.9885e30,
            angleVelocity: new Vector3(0, 0.003, 0),
        }),
    ],
    planets: [
        new RigidBody3({
            geometry: new DrawableSphere<TextureName>({
                center: new Vector3(0, 0, 149_600_000_000),
                radius: 2_439_700,
                color: new Vector3(1, 1, 1),
                textureName: 'mercury',
            }),
            mass: 3.33022e23,
            angleVelocity: new Vector3(0, 0.003, 0),
        }),
        new RigidBody3({
            geometry: new DrawableSphere<TextureName>({
                center: new Vector3(0, 0, 149_600_000_000),
                radius: 6_051_800,
                color: new Vector3(1, 1, 1),
                textureName: 'venus',
            }),
            mass: 4.8675e24,
            angleVelocity: new Vector3(0, 0.003, 0),
        }),
        new RigidBody3({
            geometry: new DrawableSphere<TextureName>({
                center: new Vector3(0, 0, 149_600_000_000),
                radius: 6_371_000,
                color: new Vector3(1, 1, 1),
                textureName: 'earth',
            }),
            mass: 5.9726e24,
            angleVelocity: new Vector3(0, 0.003, 0),
        }),
        new RigidBody3({
            geometry: new DrawableSphere<TextureName>({
                center: new Vector3(0, 0, 149_600_000_000),
                radius: 1_737_100,
                color: new Vector3(1, 1, 1),
                textureName: 'moon',
            }),
            mass: 7.3477e22,
            angleVelocity: new Vector3(0, 0.003, 0),
        }),
        new RigidBody3({
            geometry: new DrawableSphere<TextureName>({
                center: new Vector3(0, 0, 149_600_000_000),
                radius: 3_389_500,
                color: new Vector3(1, 1, 1),
                textureName: 'mars',
            }),
            mass: 6.4171e23,
            angleVelocity: new Vector3(0, 0.003, 0),
        }),

        new RigidBody3({
            geometry: new DrawableSphere<TextureName>({
                center: new Vector3(0, 0, 149_600_000_000),
                radius: 69_911_000,
                color: new Vector3(1, 1, 1),
                textureName: 'jupiter',
            }),
            mass: 1.8986e27,
            angleVelocity: new Vector3(0, 0.003, 0),
        }),
        new RigidBody3({
            geometry: new DrawableSphere<TextureName>({
                center: new Vector3(0, 0, 149_600_000_000),
                radius: 58_232_000,
                color: new Vector3(1, 1, 1),
                textureName: 'saturn',
            }),
            mass: 5.6846e26,
            angleVelocity: new Vector3(0, 0.003, 0),
        }),
        new RigidBody3({
            geometry: new DrawableSphere<TextureName>({
                center: new Vector3(0, 0, 149_600_000_000),
                radius: 25_362_000,
                color: new Vector3(1, 1, 1),
                textureName: 'uranus',
            }),
            mass: 8.6813e25,
            angleVelocity: new Vector3(0, 0.003, 0),
        }),
        new RigidBody3({
            geometry: new DrawableSphere<TextureName>({
                center: new Vector3(0, 0, 149_600_000_000),
                radius: 24_622_000,
                color: new Vector3(1, 1, 1),
                textureName: 'neptune',
            }),
            mass: 1.0243e26,
            angleVelocity: new Vector3(0, 0.003, 0),
        }),
    ],
};

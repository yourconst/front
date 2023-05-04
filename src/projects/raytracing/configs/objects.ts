import { Helpers } from "../../../helpers/common";
import { DrawableSphere } from "../../../libs/drawableGeometry/DrawableSphere";
import { Vector3 } from "../../../libs/math/Vector3";
import { Texture } from "../../../libs/render/Texture";
import { Planet } from "../physics/Planet";
import * as TEXTURES from '../textures';

Texture.create(TEXTURES['space'], { index: 0 });
Texture.create(TEXTURES['sun'], { index: 1 });

interface SpaceObject {
    name: TEXTURES.TextureName;
    radius: number;
    mass: number;
    color?: Vector3;
    center?: Vector3;
    velocity?: Vector3;
    surfaceAngleVelocity?: number;
    satelliteOf?: TEXTURES.TextureName;
    orbitRadius?: number;
}

const CONFIG: {
    stars: SpaceObject[];
    planets: SpaceObject[];
} = {
    stars: [
        { name: 'sun', radius: 696_340_000, mass: 1.9885e30, center: new Vector3(0, 0, 149_600_000_00/* 149_600_000_000 */), surfaceAngleVelocity: 7_284 / 3.6 },
    ],
    planets: [
        { name: 'mercury', radius: 2_439_700, mass: 3.33022e23, surfaceAngleVelocity: 10.892 / 3.6, satelliteOf: 'sun', orbitRadius: 46_001_009_000 },
        { name: 'venus', radius: 6_051_800, mass: 4.8675e24, surfaceAngleVelocity: 6.52 / 3.6, satelliteOf: 'sun', orbitRadius: 107_476_259_000 },
        { name: 'earth', radius: 6_371_000, mass: 5.9726e24, surfaceAngleVelocity: 1674.4 / 3.6, satelliteOf: 'sun', orbitRadius: 147_098_290_000 },
        { name: 'moon', radius: 1_737_100, mass: 7.3477e22, surfaceAngleVelocity: /* TODO. now - random */1674.4 / 3.6, satelliteOf: 'earth', orbitRadius: 363_104_000 },
        { name: 'mars', radius: 3_389_500, mass: 3.33022e23, surfaceAngleVelocity: 868.22 / 3.6, satelliteOf: 'sun', orbitRadius: 2.06655e11 },
        { name: 'jupiter', radius: 69_911_000, mass: 1.8986e27, surfaceAngleVelocity: 45_300 / 3.6, satelliteOf: 'sun', orbitRadius: 7.405736e11 },
        { name: 'saturn', radius: 58_232_000, mass: 5.6846e26, surfaceAngleVelocity: 9_870/*  / 3.6 */, satelliteOf: 'sun', orbitRadius: 1_353_572_956_000 },
        { name: 'uranus', radius: 25_362_000, mass: 8.6813e25, surfaceAngleVelocity: 9_324 / 3.6, satelliteOf: 'sun', orbitRadius: 2_748_938_461_000 },
        { name: 'neptune', radius: 24_622_000, mass: 1.0243e26, surfaceAngleVelocity: 9_648 / 3.6, satelliteOf: 'sun', orbitRadius: 4_452_940_833_000 },
    ],
};

interface CompiledSpaceObject {
    name: TEXTURES.TextureName;
    satelliteOf?: TEXTURES.TextureName;
    orbitRadius?: number;
    body: Planet;
}

export const OBJECTS: {
    stars: Partial<Record<TEXTURES.TextureName, CompiledSpaceObject>>;
    planets: Partial<Record<TEXTURES.TextureName, CompiledSpaceObject>>;
} = {
    stars: {},
    planets: {},
};

for (const star of CONFIG.stars) {
    OBJECTS.stars[star.name] = {
        name: star.name,
        satelliteOf: star.satelliteOf,
        orbitRadius: star.orbitRadius,
        body: new Planet({
            geometry: new DrawableSphere({
                texture: Texture.create(TEXTURES[star.name]),
                center: star.center,
                radius: star.radius,
                color: star.color ?? new Vector3(1, 1, 1).multiplyN(4e2),
            }),
            mass: star.mass,
            velocity: star.velocity,
            angleVelocity: new Vector3(0, (star.surfaceAngleVelocity || 0) / star.radius, 0),
            seed: Helpers.psrandi30(star.name),
        }),
    };
}

for (const planet of CONFIG.planets) {
    OBJECTS.planets[planet.name] = {
        name: planet.name,
        satelliteOf: planet.satelliteOf,
        orbitRadius: planet.orbitRadius,
        body: new Planet({
            geometry: new DrawableSphere({
                texture: Texture.create(TEXTURES[planet.name]),
                center: planet.center || new Vector3(0, 0, 1),
                radius: planet.radius,
                color: planet.color ?? new Vector3(1, 1, 1),
            }),
            mass: planet.mass,
            velocity: planet.velocity,
            angleVelocity: new Vector3(0, (planet.surfaceAngleVelocity || 0) / planet.radius, 0),
            seed: Helpers.psrandi30(planet.name),
        }),
    };
}

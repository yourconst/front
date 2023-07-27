#version 300 es
// #extension EXT_shader_framebuffer_fetch : enable
// #extension ARM_shader_framebuffer_fetch : enable
#ifdef GL_ES
precision lowp float;
#endif

// on pc limitation - 32
// on ios - 16
uniform sampler2D SAMPLER[16];


#define Rotation mat3x3
// #define Rotation vec3
// #define Rotation vec2[3]
// struct Rotation {
//     vec2 x;
//     vec2 y;
//     vec2 z;
// };

struct MaterialParsed {
    vec3 emmitance;
    vec3 reflectance;
    vec3 specularity;
    vec3 transparency;
    vec3 normal;
};

struct Material {
    vec3 emmitance;
    int indexTexture;
    vec3 reflectance;
    int indexNormalMap;
    vec3 specularity;
    int indexSpecularMap;
    vec3 transparency;
    int indexTransparencyMap;
};

struct Entity {
    vec3 center;
    int type;
    vec3 sizes;
    Rotation rotation;
    Material material;
};

struct Lens {
    float f;
    float d;
    float z;
};

uniform Info {
    Rotation rotation;
    Lens lens;
    highp vec2 halfSizes;
    float maxSize;
    // TODO
    float reverseExposure;
    float viewDistance;
    float ambient;
    int lightsCount;
    int count;
    float seed;
    int depth;
    int perPixelCount;
    highp float prevSampleMultiplier;
    Entity entities[400];
} info;

out vec4 color;

struct Ray {
    vec3 origin;
    vec3 direction;
};

// )
const float M_PI = 3.1415926535897932384626433832795;
const float M_PI2 = 2.0 * M_PI;
// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float PHI = 1.61803398874989484820459;

float random() {
    // color.z *= PHI;
    // color.w += 1.0;
    // if (color.z == 0.0) {
    //     color.z = color.w;
    // }
    color.z = fract(sin(dot(color.xy + color.z, vec2(12.9898, 78.233))) * 43758.5453 - color.z * PHI);
    color.xy = color.xy / (43758.5453 - color.z) + color.z;
    // color.xy = min(vec2(10.0), max(vec2(-10.0), color.xy * color.z));
    return color.z;
}
float srandom() {
    return -1.0 + 2.0 * random();
}

vec3 _randomCosineWeightedDirection(const in vec3 normal, const in float u) {
    // float u = random();
    float v = random();
    float r = sqrt(u);
    float angle = 6.283185307179586 * v;
    // compute basis from normal
    vec3 sdir, tdir;
    if (abs(normal.x) < .5) {
        sdir = cross(normal, vec3(1, 0, 0));
    } else {
        sdir = cross(normal, vec3(0, 1, 0));
    }
    tdir = cross(normal, sdir);
    return r * cos(angle) * sdir + r * sin(angle) * tdir + sqrt(1. - u) * normal;
}

vec3 randomCosineWeightedDirection(const in vec3 normal) {
    return _randomCosineWeightedDirection(normal, srandom());
}


vec3 getTextureTexel(const in int index, const in vec2 uv) {
    vec3 result;

    switch (index) {
        case 0: result = texture(SAMPLER[0], uv).xyz; break;
        case 1: result = texture(SAMPLER[1], uv).xyz; break;
        case 2: result = texture(SAMPLER[2], uv).xyz; break;
        case 3: result = texture(SAMPLER[3], uv).xyz; break;
        case 4: result = texture(SAMPLER[4], uv).xyz; break;
        case 5: result = texture(SAMPLER[5], uv).xyz; break;
        case 6: result = texture(SAMPLER[6], uv).xyz; break;
        case 7: result = texture(SAMPLER[7], uv).xyz; break;
        case 8: result = texture(SAMPLER[8], uv).xyz; break;
        case 9: result = texture(SAMPLER[9], uv).xyz; break;
        case 10: result = texture(SAMPLER[10], uv).xyz; break;
        case 11: result = texture(SAMPLER[11], uv).xyz; break;
        case 12: result = texture(SAMPLER[12], uv).xyz; break;
        case 13: result = texture(SAMPLER[13], uv).xyz; break;
        case 14: result = texture(SAMPLER[14], uv).xyz; break;
        case 15: result = texture(SAMPLER[15], uv).xyz; break;
    }

    return result;
}

MaterialParsed parseMaterialTexel(const in Material material, const in vec2 uv) {
    MaterialParsed result = MaterialParsed(material.emmitance, material.reflectance, material.specularity, material.transparency, vec3(0.0));

    if (material.indexTexture != -1) {
        result.reflectance = getTextureTexel(material.indexTexture, uv);
    }
    
    result.reflectance *= result.emmitance;

    if (material.indexNormalMap != -1) {
        result.normal = getTextureTexel(material.indexNormalMap, uv) * 2.0 - 1.0;
        if (material.indexNormalMap == material.indexTexture) {
            result.normal.z = (result.normal.z + 1.0) / 2.0;
            result.normal = normalize(vec3(0.0, 0.0, 1.0) + 0.1 * result.normal);
        }
        result.normal = vec3(result.normal.x, result.normal.z, result.normal.y);
    }

    if (material.indexSpecularMap != -1) {
        result.specularity = getTextureTexel(material.indexSpecularMap, uv);
    } else {
        result.specularity = vec3(pow(result.normal.z, 0.01));
    }

    if (material.indexTransparencyMap != -1) {
        result.transparency = getTextureTexel(material.indexTransparencyMap, uv);
    }

    return result;
}

vec3 getRelativeDirection(const in vec3 ap, const in Rotation rotation) {
    return rotation * ap;
    // vec3 r_;
    // r_.xy = mat2(rotation.z.x, -rotation.z.y, rotation.z.y, rotation.z.x) * ap.xy;
    // r_.xz = mat2(rotation.y.x, -rotation.y.y, rotation.y.y, rotation.y.x) * vec2(r_.x, ap.z);
    // r_.yz = mat2(rotation.x.x, -rotation.x.y, rotation.x.y, rotation.x.x) * r_.yz;
    // return r_;
}
vec3 getRelativePoint(const in vec3 ap, const in Rotation rotation, const in vec3 center) {
    return getRelativeDirection(ap - center, rotation);
}

vec3 getAbsoluteDirection(const in vec3 rp, const in Rotation rotation) {
    // return transpose(rotation) * rp;
    return rp * rotation;
    // vec3 r_;
    // r_.yz = mat2(rotation.x.x, rotation.x.y, -rotation.x.y, rotation.x.x) * rp.yz;
    // r_.xz = mat2(rotation.y.x, rotation.y.y, -rotation.y.y, rotation.y.x) * vec2(rp.x, r_.z);
    // r_.xy = mat2(rotation.z.x, rotation.z.y, -rotation.z.y, rotation.z.x) * r_.xy;
    // return r_;
}
vec3 getAbsolutePoint(const in vec3 rp, Rotation rotation, const in vec3 center) {
    return getAbsoluteDirection(rp, rotation) + center;
}

vec3 getReflectedDirection(const in vec3 direction, const in vec3 normal) {
    return direction - normal * dot(normal, direction) * 2.0;
}

float Rect3_getRayDistance(const in vec3 center, const in vec3 sizes, const in Ray ray, const in Rotation rotation) {
    vec3 origin = getRelativePoint(ray.origin, rotation, center);
    vec3 direction = getRelativeDirection(ray.direction, rotation);

    vec3 tMin = (- sizes - origin) / direction;
    vec3 tMax = (+ sizes - origin) / direction;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = (max(max(t1.x, t1.y), t1.z));
    float tFar = (min(min(t2.x, t2.y), t2.z));

    if (tNear < 0.0) {
        return info.viewDistance;
    }

    return tNear < tFar ? tNear : info.viewDistance;
}

vec3 Rect3_getNormal(const in vec3 center, const in vec3 sizes, const in vec3 hitPoint, const in Rotation rotation) {
    vec3 rhp = getRelativePoint(hitPoint, rotation, center);
    float epsilon = 0.0001;

    if(rhp.x < - sizes.x + epsilon) return getAbsoluteDirection(vec3(-1.0, 0.0, 0.0), rotation);
    else if(rhp.x > + sizes.x - epsilon) return getAbsoluteDirection(vec3(1.0, 0.0, 0.0), rotation);
    else if(rhp.y < - sizes.y + epsilon) return getAbsoluteDirection(vec3(0.0, -1.0, 0.0), rotation);
    else if(rhp.y > + sizes.y - epsilon) return getAbsoluteDirection(vec3(0.0, 1.0, 0.0), rotation);
    else if(rhp.z < - sizes.z + epsilon) return getAbsoluteDirection(vec3(0.0, 0.0, -1.0), rotation);
    else return getAbsoluteDirection(vec3(0.0, 0.0, 1.0), rotation);
}

vec3 Rect3_getRandomPoint(const in vec3 center, const in vec3 sizes, const in Rotation rotation) {
    return getAbsolutePoint(
        sizes * vec3(srandom(), srandom(), srandom()),
        rotation,
        center
    );
}

vec3 Sphere_getRandomPoint(const in vec3 center, const in float radius) {
    return center + normalize(vec3(srandom(), srandom(), srandom())) * radius;
}

float Sphere_getRayDistance(const in vec3 center, const in float radius, const in Ray ray) {
    vec3 toSphere = ray.origin - center;

    // float l = length(toSphere);
    // float er = 7.0;

    // if (er * 3.0 < radius && l - radius < er) {
    //     if (dot(ray.direction, toSphere) < 0.0) {
    //         return er;
    //     }
    //     return info.viewDistance;
    // }

    // if (l < radius) {
    //     return 0.1;
    // }

    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(toSphere, ray.direction);
    float c = dot(toSphere, toSphere) - radius*radius;
    float discriminant = b*b - 4.0*a*c;

    if(discriminant > 0.0) {
        float t = (-b - sqrt(discriminant)) / (2.0 * a);
        if(t > 0.0) return t;
    }

    return info.viewDistance;
}

vec3 Sphere_getNormal(const in vec3 center, const in float radius, const in vec3 hitPoint) {
    return (hitPoint - center) / radius;
    // return normalize(hitPoint - center);
}

vec2 getSphericalAngles(const in vec3 normal) {
    return vec2(
        /* u (z) */ atan(normal.z, normal.x),
        /* O (y) */ atan(sqrt(normal.x * normal.x + normal.z * normal.z), normal.y)
    );
}

vec3 rotateBySphericalAngles(const in vec3 rp, const in vec2 angles) {
    vec3 rs;

    float cosu = cos(-angles.y), sinu = sin(-angles.y);
    
    rs.x = rp.x * cosu - rp.y * sinu;
    rs.y = rp.x * sinu + rp.y * cosu;

    float coso = cos(-angles.x), sino = sin(-angles.x);
    
    rs.z = -rs.x * sino + rp.z * coso;
    rs.x = rs.x * coso + rp.z * sino;

    return rs;
}

vec2 Sphere_getUV(const in vec3 normal) {
    return vec2(
        0.5 + (atan(normal.z, normal.x)) / M_PI2,
        atan(sqrt(normal.x * normal.x + normal.z * normal.z), normal.y) / M_PI
    );
}

vec2 Sphere_getUVRotated(const in vec3 normal, const in Rotation rotation) {
    return Sphere_getUV(getRelativeDirection(normal, rotation));
}

vec2 Rect3_getUV(const in vec3 center, const in vec3 hitPoint, const in Rotation rotation) {
    return Sphere_getUVRotated(hitPoint - center, rotation);
}

vec3 getSkyBoxHitColor(const in vec3 rayDirection) {
    vec3 result = getTextureTexel(
        0,
        Sphere_getUV(rayDirection)
    ).xyz;
    
    // return result;

    if (length(result) > 1.0) {
        return vec3(0.1, 0.1, 0.1);
    } else {
        return vec3(0.0, 0.0, 0.0);
    }
}

vec3 getHitIllumination(const in vec3 hitPoint, const in float hitDistance, const in int hitIndex, const in vec3 hitNormal) {
    vec3 illumination = vec3(0.0, 0.0, 0.0);

    for (int j=0; j<info.lightsCount; ++j) {
        vec3 randomPoint = info.entities[j].type == 0 ?
            Sphere_getRandomPoint(
                info.entities[j].center,
                info.entities[j].sizes.x
            ) :
            Rect3_getRandomPoint(
                info.entities[j].center,
                info.entities[j].sizes,
                info.entities[j].rotation
            );
        Ray lightRay = Ray(hitPoint, normalize(randomPoint - hitPoint));
        float lightCos = dot(lightRay.direction, hitNormal);

        if (lightCos < 0.0) {
            continue;
        }

        float lightDistance = info.entities[j].type == 0 ?
            Sphere_getRayDistance(
                info.entities[j].center,
                info.entities[j].sizes.x,
                lightRay
            ) :
            Rect3_getRayDistance(
                info.entities[j].center,
                info.entities[j].sizes,
                lightRay,
                info.entities[j].rotation
            );

        bool inDark = false;

        for (int i=info.lightsCount; i<info.count; ++i) if (i != hitIndex) {
            float _distance = info.entities[i].type == 0 ?
                Sphere_getRayDistance(
                    info.entities[i].center,
                    info.entities[i].sizes.x,
                    lightRay
                ) :
                Rect3_getRayDistance(
                    info.entities[i].center,
                    info.entities[i].sizes,
                    lightRay,
                    info.entities[i].rotation
                );
    
            if (_distance < lightDistance) {
                inDark = true;
                break;
            }
        }

        if (!inDark) {
            float lightDistanceFactor = min(1.0, pow(lightDistance/*  + hitDistance */, -2.0));
            illumination += info.entities[j].material.emmitance * lightCos * lightDistanceFactor;
        }
    }

    return illumination;
}


vec3 getHitColor(Ray ray) {
    vec3 result = vec3(0.0);
    float multiplier = 1.0;

    for (int iter=0; iter<info.depth; ++iter) {
        int hitIndex = -1;
        float distance = info.viewDistance;
        for (int i=0; i<info.count; ++i) {
            float _distance = info.entities[i].type == 0 ?
                Sphere_getRayDistance(
                    info.entities[i].center,
                    info.entities[i].sizes.x,
                    ray
                ) :
                Rect3_getRayDistance(
                    info.entities[i].center,
                    info.entities[i].sizes,
                    ray,
                    info.entities[i].rotation
                );

            if (_distance < distance) {
                distance = _distance;
                hitIndex = i;
            }
        }

        if (hitIndex == -1) {
            // if (iter != 0) {
            //     // if (length(result) <= 0.1) {
            //     //     return vec3(0.0);
            //     // }
            //     multiplier *= 1e-10;
            // }
            result += getSkyBoxHitColor(ray.direction) * multiplier;
            break;
        }

        vec3 hitPoint = ray.origin + ray.direction * distance;
        vec3 hitNormal = info.entities[hitIndex].type == 0 ?
            Sphere_getNormal(
                info.entities[hitIndex].center,
                info.entities[hitIndex].sizes.x,
                hitPoint
            ) :
            Rect3_getNormal(
                info.entities[hitIndex].center,
                info.entities[hitIndex].sizes,
                hitPoint,
                info.entities[hitIndex].rotation
            );
        float distanceFactor = min(1.0, pow(distance, -2.0));

        MaterialParsed material = parseMaterialTexel(
            info.entities[hitIndex].material,
            info.entities[hitIndex].type == 0 ?
                Sphere_getUVRotated(hitNormal, info.entities[hitIndex].rotation) :
                Rect3_getUV(
                    info.entities[hitIndex].center,
                    hitPoint,
                    info.entities[hitIndex].rotation
                )
        );

        // hitNormal = normalize(hitNormal + 0.5 * material.normal);
        hitNormal = rotateBySphericalAngles(material.normal, getSphericalAngles(hitNormal));

        // float cos = -/* abs */(dot(ray.direction, hitNormal));
        // if (cos < 0.0) break;
        multiplier *= distanceFactor/*  * cos */;
        vec3 illumination = getHitIllumination(hitPoint, distance, hitIndex, hitNormal);
        result += (material.reflectance * (illumination + 1.0)) * multiplier;

        ray.origin = hitPoint;
        // float specularity = length(material.specularity) / 2.0;
        // ray.direction = _randomCosineWeightedDirection(hitNormal, 1.0 * random());
        ray.direction = normalize(
            (1.0 - material.transparency) * (
                material.specularity * getReflectedDirection(ray.direction, hitNormal) +
                (1.0 - material.specularity) * randomCosineWeightedDirection(hitNormal)
            ) +
            material.transparency * ray.direction
        );
    }

    return result;
}

void main() {
    // color = vec4(gl_FragCoord.xyz, 1.0);
    // color.xyz = vec3(gl_FragCoord.z);
    // float maxPart = max(color.x, max(color.y, color.z));
    // if (maxPart > 1.0) {
    //     color /= maxPart;
    // }
    // color.w = 1.0;
    // return;
    vec3 rp = vec3((gl_FragCoord.xy - info.halfSizes) / info.maxSize, info.lens.f);
    vec3 target = getAbsoluteDirection(rp, info.rotation);
    // vec3 dir = normalize(target);
    rp.xy /= -info.lens.f;
    rp.z = 0.0;
    vec3 source = getAbsoluteDirection(rp, info.rotation);

    // Ray ray = Ray(vec3(0.0, 0.0, 0.0), dir3);

    color.xyz = (target + PHI) * info.seed;
    // color.w += dot(vec3(random(), random(), random()), vec3(random(), random(), random()));
    // color.w = 1.37645;
    // color.w = info.seed;
    float pixelJitter = info.lens.d * info.lens.z;
    vec3 rawColor = vec3(0.0)/* max(vec3(0.0), getHitColor(ray)) */;
    for (int i=0; i<info.perPixelCount; ++i) {
        // ray.direction = _randomCosineWeightedDirection(dir3, pixelJitter * random());
        // rawColor += max(vec3(0.0), getHitColor(ray));
        // vec3 offset = dir * vec3(random(),random(),0.0);
        // offset.z = (offset.x + offset.y - d) / dir.z;
        // vec3 origin = source + source * vec3(srandom(), srandom(), srandom()) * pixelJitter;
        vec3 origin = source + getAbsoluteDirection(vec3(srandom(), srandom(), 0.0) * pixelJitter, info.rotation);
        rawColor += min(vec3(1.0), max(vec3(0.0), getHitColor(Ray(
            origin,
            normalize(target - origin)
        ))));
    }

    rawColor = pow(
        rawColor / (/* 1.0 +  */float(info.perPixelCount)),
        vec3(info.reverseExposure, info.reverseExposure, info.reverseExposure)
    );

    // float maxPart = max(rawColor.x, max(rawColor.y, rawColor.z));
    // if (maxPart > 1.0) {
    //     rawColor /= maxPart;
    // }

    // color = 0.5 * (gl_lastFragData + vec4(rawColor, 1.0));
    color = vec4(mix(
        rawColor,
        // texture(SAMPLER[1], uv).xyz,
        texelFetch(SAMPLER[1], ivec2(gl_FragCoord.xy), 0).xyz,
        info.prevSampleMultiplier
    ), 1.0);
    // color = vec4(
    //     texelFetch(SAMPLER[1], ivec2(gl_FragCoord.xy), 0).xyz * part + (1.0 - part) * rawColor,
    //     1.0
    // );
}

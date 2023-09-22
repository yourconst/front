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
    vec3 normal;
    vec3 light;
    vec3 color;
    vec3 specularity;
    float transparency;
    vec3 refraction;
};

struct Material {
    vec3 light;
    int colorMapId;
    vec3 color;
    int specularMapId;
    vec3 specularity;
    int normalMapId;
    vec3 refraction;
    int transparencyMapId;
    float transparency;
    vec2 uvOffset;
    vec2 uvScale;
};

struct Entity {
    vec3 center;
    int type;
    vec3 sizes;
    int materialId;
    Rotation rotation;
    // Material material;
};

struct Lens {
    float f;
    float d;
    float z;
    float fd;
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
    int depth;
    int perPixelCount;
    highp float prevSampleMultiplier;
    vec4 seed;
    Material materials[256];
    Entity entities[256];
} info;

out highp vec4 color;

struct Ray {
    vec3 origin;
    vec3 direction;
};

// )
const float M_PI = 3.1415926535897932384626433832795;
const float M_PI2 = 2.0 * M_PI;
// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
const float PHI = 1.61803398874989484820459;

vec2 hash22(vec2 p)
{
	p += info.seed.x;
	vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
	p3 += dot(p3, p3.yzx+33.33);
	return fract((p3.xx+p3.yz)*p3.zy);
}

uvec4 R_STATE;
void randomSetSeed(vec3 some) {
    // float base = 4e8;
    // R_STATE.x = uint(some.x * info.seed.x);
    // R_STATE.y = uint(some.y * info.seed.y);
    // R_STATE.z = uint(some.z * info.seed.z);
    // R_STATE.w = uint(abs((some.x - some.z * PHI + some.y + PHI) * info.seed.w));
    vec2 p1 = hash22(some.xy);
    vec2 p2 = hash22(vec2(some.z, p1.x));
    R_STATE.x = uint(info.seed.x * p1.x);
    R_STATE.y = uint(info.seed.y * p1.x);
    R_STATE.z = uint(info.seed.z * p2.y);
    R_STATE.w = uint(info.seed.w * p2.y);
}
uint TausStep(uint z, int S1, int S2, int S3, uint M) {
	uint b = (((z << S1) ^ z) >> S2);
	return (((z & M) << S3) ^ b);	
}
uint LCGStep(uint z, uint A, uint C) { return (A * z + C); }
float random() {
	R_STATE.x = TausStep(R_STATE.x, 13, 19, 12, uint(4294967294));
	R_STATE.y = TausStep(R_STATE.y, 2, 25, 4, uint(4294967288));
	R_STATE.z = TausStep(R_STATE.z, 3, 11, 17, uint(4294967280));
	R_STATE.w = LCGStep(R_STATE.w, uint(1664525), uint(1013904223));
	return 2.3283064365387e-10 * float((R_STATE.x ^ R_STATE.y ^ R_STATE.z ^ R_STATE.w));
}

// vec4 R_STATE;
// void randomSetSeed(vec3 some) {
//     R_STATE.xyz = info.seed.xyz * some + PHI;
// }
// float random() {
//     // color.z *= PHI;
//     // color.w += 1.0;
//     // if (color.z == 0.0) {
//     //     color.z = color.w;
//     // }

//     // color.z = fract(cos(dot(color.xy,vec2(23.14069263277926,2.665144142690225)))*123456.);
//     R_STATE.z = fract(sin(dot(R_STATE.xy + R_STATE.z, vec2(12.9898, 78.233))) * 43758.5453 - R_STATE.z * PHI);
//     R_STATE.xy = color.xy / (43758.5453 - R_STATE.z) + R_STATE.z;
//     // color.xy = min(vec2(10.0), max(vec2(-10.0), color.xy * color.z));
//     return R_STATE.z;
// }

float srandom() {
    return random() * 2.0 - 1.0;
}
vec3 randomv() {
    return vec3(random(), random(), random());
}
vec3 srandomv() {
    return randomv() * 2.0 - 1.0;
}

vec2 randomDiskPoint() {
    // return normalize(vec2(srandom(), srandom()));
    float angle = random() * M_PI2;
    float radius = sqrt(random());

    return vec2(cos(angle), sin(angle)) * radius;
}

vec3 randomSpherePoint() {
	vec3 rand = randomv();
	float theta = rand.x * M_PI2;
	float v = rand.y;
	float phi = acos(2.0 * v - 1.0);
	float r = pow(rand.z, 1.0 / 3.0);
	return vec3(
        r * sin(phi) * cos(theta),
        r * sin(phi) * sin(theta),
        r * cos(phi)
    );
}

vec3 randomCosineWeightedHemispherePoint(const in vec3 normal) {
    vec3 rand = vec3(srandom(), srandom(), srandom());
    float r = rand.x * 0.5 + 0.5; // [-1..1) -> [0..1)
    float angle = (rand.y + 1.0) * M_PI; // [-1..1] -> [0..2*PI)
    float sr = sqrt(r);
    vec2 p = vec2(sr * cos(angle), sr * sin(angle));
    /*
    * Unproject disk point up onto hemisphere:
    * 1.0 == sqrt(x*x + y*y + z*z) -> z = sqrt(1.0 - x*x - y*y)
    */
    vec3 ph = vec3(p.xy, sqrt(1.0 - p*p));
    /*
    * Compute some arbitrary tangent space for orienting
    * our hemisphere 'ph' around the normal. We use the camera's up vector
    * to have some fix reference vector over the whole screen.
    */
    vec3 tangent = normalize(rand);
    vec3 bitangent = cross(tangent, normal);
    tangent = cross(bitangent, normal);
    
    /* Make our hemisphere orient around the normal. */
    return tangent * ph.x + bitangent * ph.y + normal * ph.z;
}


vec4 getTextureTexel(const in int index, const in vec2 uv) {
    switch (index) {
        case 0: return texture(SAMPLER[0], uv);;
        case 1: return texture(SAMPLER[1], uv);;
        case 2: return texture(SAMPLER[2], uv);;
        case 3: return texture(SAMPLER[3], uv);;
        case 4: return texture(SAMPLER[4], uv);;
        case 5: return texture(SAMPLER[5], uv);;
        case 6: return texture(SAMPLER[6], uv);;
        case 7: return texture(SAMPLER[7], uv);;
        case 8: return texture(SAMPLER[8], uv);;
        case 9: return texture(SAMPLER[9], uv);;
        case 10: return texture(SAMPLER[10], uv);;
        case 11: return texture(SAMPLER[11], uv);;
        case 12: return texture(SAMPLER[12], uv);;
        case 13: return texture(SAMPLER[13], uv);;
        case 14: return texture(SAMPLER[14], uv);;
        case 15: return texture(SAMPLER[15], uv);;
    }

    return vec4(0.0);
}

MaterialParsed parseMaterialTexel(const in Material material, in vec2 uv) {
    uv = mod(material.uvOffset + material.uvScale * uv, 1.0);

    MaterialParsed result = MaterialParsed(
        vec3(0.0, 0.0, 1.0),
        material.light,
        material.color,
        material.specularity,
        material.transparency,
        material.refraction
    );

    if (material.colorMapId != -1) {
        result.color = getTextureTexel(material.colorMapId, uv).xyz;
    }
    
    // result.color *= result.light;

    if (material.specularMapId != -1) {
        result.specularity = getTextureTexel(material.specularMapId, uv).xyz;
    }/*  else {
        result.specularity = vec3(pow(result.normal.z, 0.01));
    } */

    if (material.transparencyMapId != -1) {
        result.transparency = getTextureTexel(material.transparencyMapId, uv).w;
    }

    if (material.normalMapId != -1) {
        result.normal = normalize(getTextureTexel(material.normalMapId, uv).xyz * 2.0 - 1.0);
        // result.normal = vec3(result.normal.x, result.normal.z, result.normal.y);
        // if (material.normalMapId == material.colorMapId) {
        //     result.normal.z = (result.normal.z + 1.0) / 2.0;
        //     result.normal = normalize(vec3(0.0, 0.0, 1.0) + 0.1 * result.normal);
        // }
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

float Rect3_getRayDistance(const in vec3 center, const in vec3 sizes, const in Ray ray, const in Rotation rotation) {
    vec3 o = getRelativePoint(ray.origin, rotation, center);
    vec3 d = getRelativeDirection(ray.direction, rotation);

    vec3 tMin = (- sizes - o) / d;
    vec3 tMax = (+ sizes - o) / d;
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
        sizes * srandomv(),
        rotation,
        center
    );
}

vec3 Sphere_getRandomPoint(const in vec3 center, const in float radius, const in vec3 normal) {
	// return center + randomDiskPoint(normal) * radius;
	return center + randomSpherePoint() * radius;
}

float Sphere_getRayDistance(const in vec3 center, const in float radius, const in Ray ray) {
    vec3 o = ray.origin;
    highp float d = distance(o, center);

    if (5.0 * radius < d) {
        d -= 2.0 * radius;
        o += ray.direction * d;
    } else {
        d = 0.0;
    }

    vec3 toSphere = o - center;

    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(toSphere, ray.direction);
    float c = dot(toSphere, toSphere) - radius*radius;
    float discriminant = b*b - 4.0*a*c;

    if(discriminant >= 0.0) {
        float t = (-b - sqrt(discriminant)) / (2.0 * a);
        if(t >= 0.0) return t + d;
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

bool Sphere_isPointInside(const in vec3 center, const in float radius, const in vec3 point) {
    highp vec3 d = center - point;
    return dot(d, d) < radius * radius * 0.99;
}

bool Rect3_isPointInside(const in vec3 center, const in vec3 sizes, const in vec3 point, const in Rotation rotation) {
    vec3 p = abs(getRelativePoint(point, rotation, center));
    
    return p.x < sizes.x && p.y < sizes.y && p.z < sizes.z;
}

vec3 getSkyBoxHitColor(const in vec3 rayDirection) {
    vec3 result = getTextureTexel(
        0,
        Sphere_getUV(rayDirection)
    ).xyz;
    
    // return result;

    if (length(result) > 1.0) {
        return vec3(0.1, 0.1, 0.1) * 100.0;
    } else {
        return vec3(0.0, 0.0, 0.0);
    }
}

vec3 SO_getRandomPoint(const int index, const in vec3 normal) {
    #define entity info.entities[index]
    // Entity entity = info.entities[index];

    if (entity.type == 0) {
        return Sphere_getRandomPoint(entity.center, entity.sizes.x, normal);
    } else {
        return Rect3_getRandomPoint(entity.center, entity.sizes, entity.rotation);
    }
}

vec3 SO_getNormal(const int index, const in vec3 point) {
    #define entity info.entities[index]
    // Entity entity = info.entities[index];

    if (entity.type == 0) {
        return Sphere_getNormal(entity.center, entity.sizes.x, point);
    } else {
        return Rect3_getNormal(entity.center, entity.sizes, point, entity.rotation);
    }
}

float SO_getRayDistance(const int index, const in Ray ray) {
    #define entity info.entities[index]
    // Entity entity = info.entities[index];

    if (entity.type == 0) {
        // if (Sphere_isPointInside(entity.center, entity.sizes.x, ray.origin)) {
        //     float step = 2.0 * entity.sizes.x;
        //     return -(Sphere_getRayDistance(entity.center, entity.sizes.x, Ray(ray.origin + step * ray.direction, -ray.direction)) - step);
        // }
        return Sphere_getRayDistance(entity.center, entity.sizes.x, ray);
    } else {
        // if (Rect3_isPointInside(entity.center, entity.sizes, ray.origin, entity.rotation)) {
        //     float step = 3.0 * max(entity.sizes.x, max(entity.sizes.y, entity.sizes.z));
        //     return -(Rect3_getRayDistance(entity.center, entity.sizes, Ray(ray.origin + step * ray.direction, -ray.direction), entity.rotation) - step);
        // }
        return Rect3_getRayDistance(entity.center, entity.sizes, ray, entity.rotation);
    }
}

vec2 SO_getUV(const int index, const in vec3 point, const in vec3 normal) {
    #define entity info.entities[index]
    // Entity entity = info.entities[index];

    if (entity.type == 0) {
        return Sphere_getUVRotated(normal, entity.rotation);
    } else {
        return Rect3_getUV(
            entity.center,
            point,
            entity.rotation
        );
    }

    #undef entity
}

vec3 applyTexNormal(const in vec3 normal, const in mat3 rotation, const in vec3 texNormal) {
    vec3 tangent = cross(normal, vec3(0.0, 1.0, 0.0));

    // tangent *= sign(texNormal.z);

    vec3 bitangent = cross(normal, tangent);

    mat3 TBN = mat3(tangent, bitangent, normal);
    vec3 worldNormal = normalize(TBN * texNormal);

    // vec3 finalNormal = normalize(normal + worldNormal);

    return worldNormal;
}

float getDistanceBrightness(const in float distance) {
    return 1.0 / (1.0 + 0.1 * distance + 0.1 * distance * distance);
}

float fresnel(const in vec3 normal, const in vec3 direction, const in float n1, const in float n2) {
    float r0 = (n1 - n2) / (n1 + n2);
    r0 *= r0;
    float cos0 = dot(normal, direction);

    return r0 + (1.0 - r0) * (1.0 - cos0);
}

vec3 getHitIllumination(const in vec3 hitPoint, const in int hitIndex, const in vec3 hitNormal) {
    vec3 illumination = vec3(0.0, 0.0, 0.0);

    for (int j=0; j<info.lightsCount; ++j) if (j != hitIndex) {
        vec3 randomPoint = SO_getRandomPoint(j, hitNormal);
        Ray lightRay = Ray(hitPoint, normalize(randomPoint - hitPoint));
        float lightCos = dot(lightRay.direction, hitNormal);

        if (lightCos < 0.0) {
            continue;
        }

        float lightDistance = SO_getRayDistance(j, lightRay);

        bool inDark = false;

        for (int i=0; i<info.count; ++i) if (i != j) /* if (i != hitIndex) */ {
            float distance = SO_getRayDistance(i, lightRay);
    
            if (distance < lightDistance) {
                inDark = true;
                break;
            }
        }

        if (!inDark) {
            float lightDistanceFactor = getDistanceBrightness(lightDistance);
            illumination += info.materials[info.entities[j].materialId].light * lightCos * lightDistanceFactor;
        }
    }

    return illumination;
}


vec3 getHitColor(Ray ray) {
    vec3 result = vec3(0.0);
    vec3 multiplier = vec3(1.0);

    for (int iter=0; iter<info.depth; ++iter) {
        int hitIndex = -1;
        float distance = info.viewDistance;
        for (int i=0; i<info.count; ++i) {
            float _distance = SO_getRayDistance(i, ray);

            if (_distance < distance) {
                distance = _distance;
                hitIndex = i;
            }
        }

        if (hitIndex == -1) {
            result += getSkyBoxHitColor(ray.direction) * multiplier;
            break;
        }

        vec3 hitPoint = ray.origin + ray.direction * distance;
        vec3 hitNormal = SO_getNormal(hitIndex, hitPoint);

        MaterialParsed material = parseMaterialTexel(
            info.materials[info.entities[hitIndex].materialId],
            SO_getUV(hitIndex, hitPoint, hitNormal)
        );

        // hitNormal = rotateBySphericalAngles(material.normal, getSphericalAngles(hitNormal));
        hitNormal = applyTexNormal(hitNormal, info.entities[hitIndex].rotation, material.normal);

        float cos = -/* abs */(dot(ray.direction, hitNormal));

        if (cos < 0.0) break;
        multiplier *= getDistanceBrightness(distance);
        vec3 vrandref = vec3(random(), random(), random());
        vrandref /= vrandref.x + vrandref.y + vrandref.z;
        float randref = dot(vrandref, material.refraction);
        if (fresnel(hitNormal, ray.direction, 1.0, randref) * material.transparency * random() < 0.1) {
            // multiplier *= cos * (1.0 - material.specularity.x);
            vec3 illumination = cos * getHitIllumination(hitPoint, hitIndex, hitNormal);
            result += (material.color * (material.light + illumination + info.ambient)) * multiplier;

            ray.origin = hitPoint;
            // float specularity = length(material.specularity) / 2.0;
            // ray.direction = _randomCosineWeightedDirection(hitNormal, 1.0 * random());
            // vec3 lightRandPoint = SO_getRandomPoint(int(random() * float(info.lightsCount)), hitNormal);
            // float toLight = random();
            ray.direction = normalize(
                /* (1.0 - material.transparency) *  */(
                    material.specularity.x * reflect(ray.direction, hitNormal) +
                    (1.0 - material.specularity.x) * (
                        randomCosineWeightedHemispherePoint(hitNormal)
                        // (1.0 - toLight) * randomCosineWeightedHemispherePoint(hitNormal) +
                        // toLight * normalize(lightRandPoint - hitPoint)
                    )
                )
            );
        } else {
            ray.direction = -refract(
                normalize(ray.direction),
                normalize(hitNormal),
                1.0 / randref
            );
            ray.origin = hitPoint - ray.direction * 10.0;
            distance = /* 0.1 +  */SO_getRayDistance(hitIndex, ray);
            multiplier *= getDistanceBrightness(distance) * vrandref * 9.0;
            ray.origin += (/* 0.01 +  */distance) * ray.direction;
            // ray.direction *= -1.0;
            ray.direction = refract(
                -ray.direction,
                -SO_getNormal(hitIndex, ray.origin),
                randref
            );
            // multiplier *= randref;
        }

        ray.origin += 0.001 * ray.direction;
    }

    return result;
}

void main() {
    vec3 rp = vec3((gl_FragCoord.xy - info.halfSizes) / info.halfSizes.x, info.lens.f);
    vec3 target = getAbsoluteDirection(rp, info.rotation);
    // vec3 dir = normalize(target);
    rp.xy /= -info.lens.f;
    rp.z = 0.0;
    vec3 source = getAbsoluteDirection(rp, info.rotation);
    target = source + (target - source) * info.lens.fd / info.lens.f;

    randomSetSeed(/* source + target + target * source +  */gl_FragCoord.xyz);
    // color = vec4(random(), random(), random(), 1.0);
    // return;

    float pixelJitter = info.lens.d * info.lens.z;
    vec3 rawColor = vec3(0.0);
    for (int i=0; i<info.perPixelCount; ++i) {
        vec3 origin = source + getAbsoluteDirection(vec3(randomDiskPoint() * pixelJitter, 0.0), info.rotation);
        rawColor += getHitColor(Ray(
            origin,
            normalize(target - origin)
        ));
    }

    rawColor = pow(
        rawColor / (/* 1.0 +  */float(info.perPixelCount)),
        vec3(info.reverseExposure)
    );

    // float maxPart = max(rawColor.x, max(rawColor.y, rawColor.z));
    // if (maxPart > 1.0) {
    //     rawColor /= maxPart;
    // }

    // color = 0.5 * (gl_lastFragData + vec4(rawColor, 1.0));
    color = vec4(mix(
        texelFetch(SAMPLER[1], ivec2(gl_FragCoord.xy), 0).xyz,
        // clamp(rawColor, vec3(0.0), vec3(1.0)),
        rawColor,
        info.prevSampleMultiplier
    ), 1.0);
    // color = vec4(
    //     texelFetch(SAMPLER[1], ivec2(gl_FragCoord.xy), 0).xyz * part + (1.0 - part) * rawColor,
    //     1.0
    // );
}

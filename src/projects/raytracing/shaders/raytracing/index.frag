#version 300 es
#ifdef GL_ES
precision mediump float;
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

struct Entity {
    vec3 center;
    int type;
    vec3 sizes;
    int textureIndex;
    vec3 color;
    Rotation rotation;
};

uniform Info {
    Rotation rotation;
    vec2 halfSizes;
    float maxSize;
    float d;
    // TODO
    float reverseExposure;
    float viewDistance;
    float ambient;
    int lightsCount;
    int count;
    Entity entities[400];
} info;

out vec4 color;

struct Ray {
    vec3 origin;
    vec3 direction;
};

vec3 getTextureTexel(int index, vec2 uv) {
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

vec3 getRelativeDirection(const vec3 ap, const Rotation rotation) {
    return rotation * ap;
}
vec3 getRelativePoint(const vec3 ap, const Rotation rotation, const vec3 center) {
    return getRelativeDirection(ap - center, rotation);
}

vec3 getAbsoluteDirection(const vec3 rp, const Rotation rotation) {
    return rp * rotation;
}
vec3 getAbsolutePoint(const vec3 rp, Rotation rotation, const vec3 center) {
    return getAbsoluteDirection(rp, rotation) + center;
}

float Rect3_getRayDistance(const vec3 center, const vec3 sizes, const Ray ray, const Rotation rotation) {
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

vec3 Rect3_getNormal(const vec3 center, const vec3 sizes, const vec3 hitPoint, const Rotation rotation) {
    vec3 rhp = getRelativePoint(hitPoint, rotation, center);
    float epsilon = 0.0001;

    if(rhp.x < - sizes.x + epsilon) return getAbsoluteDirection(vec3(-1.0, 0.0, 0.0), rotation);
    else if(rhp.x > + sizes.x - epsilon) return getAbsoluteDirection(vec3(1.0, 0.0, 0.0), rotation);
    else if(rhp.y < - sizes.y + epsilon) return getAbsoluteDirection(vec3(0.0, -1.0, 0.0), rotation);
    else if(rhp.y > + sizes.y - epsilon) return getAbsoluteDirection(vec3(0.0, 1.0, 0.0), rotation);
    else if(rhp.z < - sizes.z + epsilon) return getAbsoluteDirection(vec3(0.0, 0.0, -1.0), rotation);
    else return getAbsoluteDirection(vec3(0.0, 0.0, 1.0), rotation);
}

struct Range {
    float min, max;
};

Range Sphere_getRayDistanceRange(const vec3 center, const float radius, const Ray ray) {
    vec3 toSphere = ray.origin - center;

    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(toSphere, ray.direction);
    float c = dot(toSphere, toSphere) - radius*radius;
    float discriminant = b*b - 4.0*a*c;

    if(discriminant > 0.0) {
        float _min = (-b - sqrt(discriminant)) / (2.0 * a);
        float _max = (-b + sqrt(discriminant)) / (2.0 * a);
        if (_max > 0.0) {
            return Range(max(0.0, _min), _max);
        }
    }

    return Range(info.viewDistance, info.viewDistance);
}

float Sphere_getRayDistance(const vec3 center, const float radius, const Ray ray) {
    vec3 toSphere = ray.origin - center;

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

vec3 Sphere_getNormal(vec3 center, float radius, vec3 hitPoint) {
    return (hitPoint - center) / radius;
}

// )
const float M_PI = 3.1415926535897932384626433832795;
const float M_PI2 = 2.0 * M_PI;

vec2 Sphere_getUV(const vec3 normal) {
    return vec2(
        0.5 + (atan(normal.z, normal.x)) / M_PI2,
        atan(sqrt(normal.x * normal.x + normal.z * normal.z), normal.y) / M_PI
    );
}

vec2 Sphere_getUVRotated(const vec3 normal, const Rotation rotation) {
    return Sphere_getUV(getRelativeDirection(normal, rotation));
}

vec2 Rect3_getUV(const vec3 center, const vec3 hitPoint, const Rotation rotation) {
    return Sphere_getUVRotated(hitPoint - center, rotation);
}

vec3 getSkyBoxHitColor(const vec3 rayDirection) {
    vec3 result = getTextureTexel(
        0,
        Sphere_getUV(rayDirection)
    ).xyz;

    if (length(result) > 1.0) {
        return vec3(0.1, 0.1, 0.1);
    } else {
        return vec3(0.0, 0.0, 0.0);
    }
}

vec3 getHitIllumination(const vec3 hitPoint, const float hitDistance, const int hitIndex, const vec3 hitNormal) {
    vec3 illumination = vec3(0.0, 0.0, 0.0);

    for (int j=0; j<info.lightsCount; ++j) {
        Ray lightRay = Ray(hitPoint, normalize(info.entities[j].center - hitPoint));
        float lightCos = 1.0;

        if (hitNormal.x > -2.0) {
            lightCos = dot(lightRay.direction, hitNormal);

            if (lightCos < 0.0) {
                continue;
            }
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
            float lightDistanceFactor = min(1.0, pow(lightDistance + hitDistance, -2.0));
            illumination += info.entities[j].color * lightCos * lightDistanceFactor;
        }
    }

    return illumination;
}

struct DiffuseHit {
    int index;
    float distance;
};

struct TransparentHit {
    int index;
    Range distanceRange;
};

vec3 getHitColor(const Ray ray) {
    TransparentHit atmoHits[30];
    int atmoHitsCount = 0;

    DiffuseHit diffuseHit = DiffuseHit(-1, info.viewDistance);

    for (int i=0; i<info.count; ++i) {
        float distance = info.entities[i].type == 0 ?
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

        if (distance < diffuseHit.distance) {
            diffuseHit.index = i;
            diffuseHit.distance = distance;
        }
        
        if (info.entities[i].type != 0 || info.entities[i].sizes.x > info.entities[i].sizes.y) {
            continue;
        }

        Range dr = Sphere_getRayDistanceRange(
            info.entities[i].center,
            info.entities[i].sizes.y,
            ray
        );

        if (dr.min < diffuseHit.distance) {
            atmoHits[atmoHitsCount] = TransparentHit(i, dr);
            ++atmoHitsCount;
        }
    }

    vec3 atmoColor = vec3(0.0, 0.0, 0.0);

    for (int i=0; i<atmoHitsCount; ++i) {
        if (diffuseHit.distance < atmoHits[i].distanceRange.min) {
            continue;
        }

        int hitIndex = atmoHits[i].index;
        Range range = atmoHits[i].distanceRange;
        range.max = min(diffuseHit.distance, range.max);
        float atmoMultiplier = info.entities[hitIndex].sizes.z;

        vec3 hitColor = info.entities[hitIndex].color;

        // vec3 hitPoint = ray.origin + ray.direction * range.min;
        // vec3 illumination = getHitIllumination(hitPoint, range.min, -1, vec3(-100.0));

        vec3 illumination = vec3(0.0, 0.0, 0.0);

        float cnt = 30.0;
        float step = 1.0 / cnt;
        for (float k=0.0; k<1.0; k += step) {
            vec3 hitPoint = ray.origin + ray.direction * (range.min + k * (range.max - range.min));
            illumination += getHitIllumination(hitPoint, range.min, -1, vec3(-100.0));
        }
        illumination /= cnt;

        atmoColor += (hitColor * illumination + hitColor * info.ambient) * pow((range.max - range.min) * atmoMultiplier, 1.0);
    }

    if (diffuseHit.index == -1) {
        return atmoColor + getSkyBoxHitColor(ray.direction);
    }

    int hitIndex = diffuseHit.index;
    float distance = diffuseHit.distance;

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
    float cos = -dot(ray.direction, hitNormal);
    float distanceFactor = min(1.0, pow(distance, -2.0));

    vec3 hitColor = info.entities[hitIndex].textureIndex == -1 ?
        info.entities[hitIndex].color :
        getTextureTexel(
            info.entities[hitIndex].textureIndex,
            info.entities[hitIndex].type == 0 ?
                Sphere_getUVRotated(hitNormal, info.entities[hitIndex].rotation) :
                Rect3_getUV(
                    info.entities[hitIndex].center,
                    hitPoint,
                    info.entities[hitIndex].rotation
                )
        ) * info.entities[hitIndex].color;

    // if (hitIndex < info.lightsCount) {
    //     return hitColor * info.entities[hitIndex].color * cos * (0.05 + distanceFactor);
    // }

    vec3 illumination = getHitIllumination(hitPoint, distance, hitIndex, hitNormal);

    return atmoColor + (hitColor * info.ambient * distanceFactor + hitColor * illumination) * cos;
}

void main() {
    vec3 rp = vec3((gl_FragCoord.xy - info.halfSizes) / info.maxSize, info.d);

    vec3 dir3 = getAbsoluteDirection(rp, info.rotation);

    Ray ray = Ray(vec3(0.0, 0.0, 0.0), normalize(dir3));

    vec3 rawColor = getHitColor(ray);

    rawColor = pow(rawColor, vec3(info.reverseExposure, info.reverseExposure, info.reverseExposure));

    // float maxPart = max(rawColor.x, max(rawColor.y, rawColor.z));
    // if (maxPart > 1.0) {
    //     rawColor /= maxPart;
    // }

    color = vec4(rawColor, 1.0);
}

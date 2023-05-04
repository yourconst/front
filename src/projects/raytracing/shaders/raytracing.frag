#version 300 es
#ifdef GL_ES
precision mediump float;
#endif

// on pc limitation - 32
// on ios - 16
uniform sampler2D SAMPLER[16];


// #define Rotation mat3x3
// #define Rotation vec3
// #define Rotation vec2[3]
struct Rotation {
    vec2 x;
    vec2 y;
    vec2 z;
};

struct Sphere {
    vec3 center;
    float radius;
    vec3 color;
    int type;
    int textureIndex;
    float atmosphereRadius;
    Rotation rotation;
};

uniform Info {
    mat3x3 rotationMatrix;
    vec2 sizes;
    float d;
    float viewDistance;
    int lightsCount;
    int count;
    Sphere spheres[100];
} info;

out vec4 color;

struct Ray {
    vec3 origin;
    vec3 direction;
};

vec4 getTextureTexel(int index, vec2 uv, const vec3 baseColor) {
    if (index < 0 || 31 < index) {
        return vec4(baseColor, 1.0);
    }

    vec4 result;

    switch (index) {
        case 0: result = texture(SAMPLER[0], uv); break;
        case 1: result = texture(SAMPLER[1], uv); break;
        case 2: result = texture(SAMPLER[2], uv); break;
        case 3: result = texture(SAMPLER[3], uv); break;
        case 4: result = texture(SAMPLER[4], uv); break;
        case 5: result = texture(SAMPLER[5], uv); break;
        case 6: result = texture(SAMPLER[6], uv); break;
        case 7: result = texture(SAMPLER[7], uv); break;
        case 8: result = texture(SAMPLER[8], uv); break;
        case 9: result = texture(SAMPLER[9], uv); break;
        case 10: result = texture(SAMPLER[10], uv); break;
        case 11: result = texture(SAMPLER[11], uv); break;
        case 12: result = texture(SAMPLER[12], uv); break;
        case 13: result = texture(SAMPLER[13], uv); break;
        case 14: result = texture(SAMPLER[14], uv); break;
        case 15: result = texture(SAMPLER[15], uv); break;
    }

    return result;
}

vec3 getRelativeDirection(const vec3 ap, const Rotation rotation) {
    vec3 r_;
    r_.xy = mat2(rotation.z.x, -rotation.z.y, rotation.z.y, rotation.z.x) * ap.xy;
    r_.xz = mat2(rotation.y.x, -rotation.y.y, rotation.y.y, rotation.y.x) * vec2(r_.x, ap.z);
    r_.yz = mat2(rotation.x.x, -rotation.x.y, rotation.x.y, rotation.x.x) * r_.yz;
    return r_;
}
vec3 getRelativePoint(const vec3 ap, const Rotation rotation, const vec3 center) {
    return getRelativeDirection(ap - center, rotation);
}

vec3 getAbsoluteDirection(const vec3 rp, const Rotation rotation) {
    vec3 r_;
    r_.yz = mat2(rotation.x.x, rotation.x.y, -rotation.x.y, rotation.x.x) * rp.yz;
    r_.xz = mat2(rotation.y.x, rotation.y.y, -rotation.y.y, rotation.y.x) * vec2(rp.x, r_.z);
    r_.xy = mat2(rotation.z.x, rotation.z.y, -rotation.z.y, rotation.z.x) * r_.xy;
    return r_;
}
vec3 getAbsolutePoint(const vec3 rp, Rotation rotation, const vec3 center) {
    return getAbsoluteDirection(rp, rotation) + center;
}

float AABB_getRayDistance(const vec3 center, const float radius, const Ray ray, const Rotation rotation) {
    vec3 origin = getRelativePoint(ray.origin, rotation, center);
    vec3 direction = getRelativeDirection(ray.direction, rotation);
    vec3 rv = vec3(radius,radius,radius);

    vec3 tMin = (- rv - origin) / direction;
    vec3 tMax = (+ rv - origin) / direction;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = (max(max(t1.x, t1.y), t1.z));
    float tFar = (min(min(t2.x, t2.y), t2.z));

    if (tFar < 0.0) {
        return info.viewDistance;
    }

    return tNear < tFar ? tNear : info.viewDistance;
}

vec3 AABB_getNormal(const vec3 center, const float radius, const vec3 hitPoint, const Rotation rotation) {
    vec3 rhp = getRelativePoint(hitPoint, rotation, center);
    float epsilon = 0.0001;

    if(rhp.x < - radius + epsilon) return getAbsoluteDirection(vec3(-1.0, 0.0, 0.0), rotation);
    else if(rhp.x > + radius - epsilon) return getAbsoluteDirection(vec3(1.0, 0.0, 0.0), rotation);
    else if(rhp.y < - radius + epsilon) return getAbsoluteDirection(vec3(0.0, -1.0, 0.0), rotation);
    else if(rhp.y > + radius - epsilon) return getAbsoluteDirection(vec3(0.0, 1.0, 0.0), rotation);
    else if(rhp.z < - radius + epsilon) return getAbsoluteDirection(vec3(0.0, 0.0, -1.0), rotation);
    else return getAbsoluteDirection(vec3(0.0, 0.0, 1.0), rotation);
}

float Sphere_getRayDistance(const vec3 center, const float radius, const Ray ray) {
    vec3 toSphere = ray.origin - center;

    float l = length(toSphere);
    float er = 7.0;

    if (er * 3.0 < radius && l - radius < er) {
        if (dot(ray.direction, toSphere) < 0.0) {
            return er;
        }
        return info.viewDistance;
    }

    if (l < radius) {
        return 0.1;
    }

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
    // return normalize(hitPoint - center);
}

// )
const float M_PI = 3.1415926535897932384626433832795;
const float M_PI2 = 2.0 * M_PI;

vec2 getUV(const vec3 normal) {
    return vec2(
        0.5 + (atan(normal.z, normal.x)) / M_PI2,
        atan(sqrt(normal.x * normal.x + normal.z * normal.z), normal.y) / M_PI
    );
}

vec2 getUVRotated(const vec3 normal, const Rotation rotation) {
    return getUV(getRelativeDirection(normal, rotation));
}

vec3 getSkyBoxHitColor(const vec3 rayDirection) {
    vec3 result = getTextureTexel(
        0,
        getUV(rayDirection),
        vec3(0.0, 0.0, 0.0)
    ).xyz;

    if (length(result) > 1.0) {
        return vec3(0.1, 0.1, 0.1);
    } else {
        return vec3(0.0, 0.0, 0.0);
    }
}

vec3 getHitReflectColor(const vec3 hitPoint, const float hitDistance, const vec3 hitColor, const int hitIndex, vec3 hitNormal) {
    vec3 reflectColor = vec3(0.0, 0.0, 0.0);

    for (int j=0; j<info.lightsCount; ++j) {
        Ray lightRay = Ray(hitPoint, normalize(info.spheres[j].center - hitPoint));
        float lightCos = dot(lightRay.direction, hitNormal);

        if (lightCos < 0.0) {
            continue;
        }

        float lightDistance = info.spheres[j].type == 0 ?
            Sphere_getRayDistance(
                info.spheres[j].center,
                info.spheres[j].radius,
                lightRay
            ) :
            AABB_getRayDistance(
                info.spheres[j].center,
                info.spheres[j].radius,
                lightRay,
                info.spheres[j].rotation
            );

        bool inDark = false;

        for (int i=info.lightsCount; i<info.count; ++i) if (i != hitIndex) {
            float _distance = info.spheres[i].type == 0 ?
                Sphere_getRayDistance(
                    info.spheres[i].center,
                    info.spheres[i].radius,
                    lightRay
                ) :
                AABB_getRayDistance(
                    info.spheres[i].center,
                    info.spheres[i].radius,
                    lightRay,
                    info.spheres[i].rotation
                );
    
            if (_distance < lightDistance) {
                inDark = true;
                break;
            }
        }

        if (!inDark) {
            float lightDistanceFactor = min(1.0, pow(lightDistance / info.spheres[j].radius, -2.0));
            float viewDistanceFactor = min(1.0, pow(hitDistance / info.spheres[j].radius, -1.0));
            reflectColor += hitColor * info.spheres[j].color * lightCos * (lightDistanceFactor * viewDistanceFactor);
        }
    }

    return reflectColor;
}


vec3 getHitColor(const Ray ray) {
    int hitIndex = -1;
    float distance = info.viewDistance;
    for (int i=0; i<info.count; ++i) {
        float _distance = info.spheres[i].type == 0 ?
            Sphere_getRayDistance(
                info.spheres[i].center,
                info.spheres[i].radius,
                ray
            ) :
            AABB_getRayDistance(
                info.spheres[i].center,
                info.spheres[i].radius,
                ray,
                info.spheres[i].rotation
            );

        if (_distance < distance) {
            distance = _distance;
            hitIndex = i;
        }
    }

    if (hitIndex == -1) {
        return getSkyBoxHitColor(ray.direction);
    }

    vec3 hitPoint = ray.origin + ray.direction * distance;
    vec3 hitNormal = info.spheres[hitIndex].type == 0 ?
        Sphere_getNormal(
            info.spheres[hitIndex].center,
            info.spheres[hitIndex].radius,
            hitPoint
        ) :
        AABB_getNormal(
            info.spheres[hitIndex].center,
            info.spheres[hitIndex].radius,
            hitPoint,
            info.spheres[hitIndex].rotation
        );
    float cos = -dot(ray.direction, hitNormal);
    float distanceFactor = min(1.0, pow(distance / info.spheres[hitIndex].radius, -2.0));

    vec3 hitColor = getTextureTexel(
        info.spheres[hitIndex].textureIndex,
        getUVRotated(hitNormal, info.spheres[hitIndex].rotation),
        info.spheres[hitIndex].color
    ).xyz;

    if (hitIndex < info.lightsCount) {
        return hitColor * info.spheres[hitIndex].color * cos * (0.05 + distanceFactor);
    }

    vec3 reflectColor = getHitReflectColor(hitPoint, distance, hitColor, hitIndex, hitNormal);

    return (hitColor * 0.01 * distanceFactor + reflectColor) * cos;
}

void main() {
    float m = info.sizes.x > info.sizes.y ? info.sizes.x : info.sizes.y;
    vec3 rp = vec3((gl_FragCoord.xy - (info.sizes * 0.5)) / m, info.d);

    vec3 dir3 = info.rotationMatrix * rp;

    Ray ray = Ray(vec3(0.0, 0.0, 0.0), normalize(dir3));

    vec3 rawColor = getHitColor(ray);

    rawColor = pow(rawColor, vec3(1.0/2.2, 1.0/2.2, 1.0/2.2));

    float maxPart = max(rawColor.x, max(rawColor.y, rawColor.z));

    if (maxPart > 1.0) {
        rawColor /= maxPart;
    }

    color = vec4(rawColor, 1.0);
}

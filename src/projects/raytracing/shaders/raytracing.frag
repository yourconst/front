#version 300 es
#ifdef GL_ES
precision mediump float;
#endif

// on pc limitation - 32
// on ios - 16
uniform sampler2D SAMPLER[16];

struct Sphere {
    vec3 center;
    float radius;
    vec3 color;
    int textureIndex;
    vec2 angles;
    float atmosphereRadius;
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

vec4 getTextureTexel(int index, vec2 uv/* , float bias */, const vec3 baseColor) {
    if (index < 0 || 31 < index) {
        return vec4(baseColor, 1.0);
    }

    vec4 result;

    switch (index) {
        case 0: result = texture(SAMPLER[0], uv/* , bias */); break;
        case 1: result = texture(SAMPLER[1], uv/* , bias */); break;
        case 2: result = texture(SAMPLER[2], uv/* , bias */); break;
        case 3: result = texture(SAMPLER[3], uv/* , bias */); break;
        case 4: result = texture(SAMPLER[4], uv/* , bias */); break;
        case 5: result = texture(SAMPLER[5], uv/* , bias */); break;
        case 6: result = texture(SAMPLER[6], uv/* , bias */); break;
        case 7: result = texture(SAMPLER[7], uv/* , bias */); break;
        case 8: result = texture(SAMPLER[8], uv/* , bias */); break;
        case 9: result = texture(SAMPLER[9], uv/* , bias */); break;
        case 10: result = texture(SAMPLER[10], uv/* , bias */); break;
        case 11: result = texture(SAMPLER[11], uv/* , bias */); break;
        case 12: result = texture(SAMPLER[12], uv/* , bias */); break;
        case 13: result = texture(SAMPLER[13], uv/* , bias */); break;
        case 14: result = texture(SAMPLER[14], uv/* , bias */); break;
        case 15: result = texture(SAMPLER[15], uv/* , bias */); break;
        // case 16: result = texture(SAMPLER[16], uv/* , bias */); break;
        // case 17: result = texture(SAMPLER[17], uv/* , bias */); break;
        // case 18: result = texture(SAMPLER[18], uv/* , bias */); break;
        // case 19: result = texture(SAMPLER[19], uv/* , bias */); break;
        // case 20: result = texture(SAMPLER[20], uv/* , bias */); break;
        // case 21: result = texture(SAMPLER[21], uv/* , bias */); break;
        // case 22: result = texture(SAMPLER[22], uv/* , bias */); break;
        // case 23: result = texture(SAMPLER[23], uv/* , bias */); break;
        // case 24: result = texture(SAMPLER[24], uv/* , bias */); break;
        // case 25: result = texture(SAMPLER[25], uv/* , bias */); break;
        // case 26: result = texture(SAMPLER[26], uv/* , bias */); break;
        // case 27: result = texture(SAMPLER[27], uv/* , bias */); break;
        // case 28: result = texture(SAMPLER[28], uv/* , bias */); break;
        // case 29: result = texture(SAMPLER[29], uv/* , bias */); break;
        // case 30: result = texture(SAMPLER[30], uv/* , bias */); break;
        // case 31: result = texture(SAMPLER[31], uv/* , bias */); break;
    }

    return result;
}

float Sphere_getRayDistance(vec3 center, float radius, Ray ray) {
    vec3 toSphere = ray.origin - center;

    if (length(toSphere) < radius) {
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
    // return (hitPoint - center) / radius;
    return normalize(hitPoint - center);
}

// )
const float M_PI = 3.1415926535897932384626433832795;
const float M_PI2 = 2.0 * M_PI;

vec2 getUV(vec3 normal, vec2 angles) {
    // TODO: replace with matrix
    float cosy = cos(angles.x), siny = sin(angles.x);
    
    float y = normal.y * cosy - normal.z * siny;
    float z = normal.y * siny + normal.z * cosy;

    float cosx = cos(angles.y), sinx = sin(angles.y);
    
    float x = normal.x * cosx - z * sinx;
    z = normal.x * sinx + z * cosx;

    normal = vec3(x, y, z);

    return vec2(
        0.5 + (atan(normal.z, normal.x)) / M_PI2,
        atan(sqrt(normal.x * normal.x + normal.z * normal.z), normal.y) / M_PI
    );
}

vec3 getSkyBoxHitColor(vec3 rayDirection) {
    vec3 result = getTextureTexel(
        0,
        getUV(rayDirection, vec2(0.0, 0.0)),
        // 1.0,
        vec3(0.0, 0.0, 0.0)
    ).xyz;

    if (length(result) > 1.0) {
        return vec3(0.1, 0.1, 0.1);
    } else {
        return vec3(0.0, 0.0, 0.0);
    }
}

vec3 getHitReflectColor(vec3 hitPoint, float hitDistance, vec3 hitColor, int hitIndex, vec3 hitNormal, bool faceToLight) {
    vec3 reflectColor = vec3(0.0, 0.0, 0.0);

    for (int j=0; j<info.lightsCount; ++j) {
        Ray lightRay = Ray(hitPoint, normalize(info.spheres[j].center - hitPoint));
        float lightCos = faceToLight ? 1.0 : dot(lightRay.direction, hitNormal);

        if (lightCos < 0.0) {
            continue;
        }

        float lightDistance = Sphere_getRayDistance(
            info.spheres[j].center,
            info.spheres[j].radius,
            lightRay
        );

        bool inDark = false;

        for (int i=info.lightsCount; i<info.count; ++i) if (i != hitIndex) {
            float _distance = Sphere_getRayDistance(
                info.spheres[i].center,
                info.spheres[i].radius,
                lightRay
            );
    
            if (_distance < lightDistance) {
                inDark = true;
                break;
            }
        }

        if (!inDark) {
            float lightDistanceFactor = min(1.0, pow(lightDistance / info.spheres[j].radius, -2.0));
            // TODO
            float viewDistanceFactor = min(1.0, pow(hitDistance / info.spheres[j].radius, -1.0));
            reflectColor += hitColor * info.spheres[j].color * lightCos * (lightDistanceFactor * viewDistanceFactor);
        }
    }

    return reflectColor;
}

struct BodyHitDistance {
    int index;
    float distance;
};


vec3 getHitColorWithAtmosphere(Ray ray) {
    BodyHitDistance hits[100];

    BodyHitDistance diffuseHit = BodyHitDistance(-1, info.viewDistance);
    int hitsCount = 0;

    for (int i=0; i<info.count; ++i) {
        float distance = Sphere_getRayDistance(
            info.spheres[i].center,
            info.spheres[i].radius,
            ray
        );

        if (distance < diffuseHit.distance) {
            diffuseHit.distance = distance;
            diffuseHit.index = i;
        }

        distance = Sphere_getRayDistance(
            info.spheres[i].center,
            info.spheres[i].atmosphereRadius,
            ray
        );

        if (distance < diffuseHit.distance) {
            hits[hitsCount] = BodyHitDistance(i, distance);
            ++hitsCount;
        }
    }

    vec3 result = vec3(0.0, 0.0, 0.0);

    for (int i=0; i<hitsCount; ++i) {
        if (diffuseHit.distance < hits[i].distance) {
            continue;
        }

        float distance = hits[i].distance;
        int hitIndex = hits[i].index;

        vec3 hitPoint = ray.origin + ray.direction * distance;
        vec3 hitNormal = Sphere_getNormal(
            info.spheres[hitIndex].center,
            info.spheres[hitIndex].radius,
            hitPoint
        );
        float cos = -dot(ray.direction, hitNormal);
        float distanceFactor = min(1.0, pow(distance / info.spheres[hitIndex].radius, -2.0));

        vec3 hitColor = normalize(info.spheres[hitIndex].color);

        float sin = pow(1.0 - cos*cos, 0.5);
        float ratio = info.spheres[hitIndex].atmosphereRadius / info.spheres[hitIndex].radius;
        float position = sin * ratio - 1.0;
        if (position < 0.0) {
            position = -position * (ratio - 1.0);
        } else
        if (distance < 1.0) {
            position = 0.0;
        }
        float reverse = abs(position) / /* max */(/* 1.0,  */ratio - 1.0);
        float multiplier = pow(1.0 - reverse, 4.0);

        if (hitIndex < info.lightsCount) {
            result += hitColor * multiplier * distanceFactor;
            continue;
        }

        vec3 reflectColor = getHitReflectColor(hitPoint, distance, hitColor, hitIndex, hitNormal, false);

        result += reflectColor * multiplier;
    }

    if (diffuseHit.index == -1) {
        return result + getSkyBoxHitColor(ray.direction);
    }

    int hitIndex = diffuseHit.index;
    float distance = diffuseHit.distance;

    vec3 hitPoint = ray.origin + ray.direction * distance;
    vec3 hitNormal = Sphere_getNormal(
        info.spheres[hitIndex].center,
        info.spheres[hitIndex].radius,
        hitPoint
    );
    float cos = -dot(ray.direction, hitNormal);
    float distanceFactor = min(1.0, pow(distance / info.spheres[hitIndex].radius, -2.0));

    vec3 hitColor = getTextureTexel(
        info.spheres[hitIndex].textureIndex,
        getUV(hitNormal, info.spheres[hitIndex].angles),
        // 1.0,
        info.spheres[hitIndex].color
    ).xyz;

    // Fake depth texture
    // hitNormal = normalize(hitNormal + hitColor * 0.5);
    // hitColor = info.spheres[hitIndex].color;

    if (hitIndex < info.lightsCount) {
        return result + hitColor/*  * info.spheres[hitIndex].color */ * cos * (0.05 + distanceFactor);
    }

    vec3 reflectColor = getHitReflectColor(hitPoint, distance, hitColor, hitIndex, hitNormal, false);

    return result + (hitColor * 0.01 * distanceFactor + reflectColor) * cos;
}


vec3 getHitColor(Ray ray) {
    int hitIndex = -1;
    float distance = info.viewDistance;
    for (int i=0; i<info.count; ++i) {
        float _distance = Sphere_getRayDistance(
            info.spheres[i].center,
            info.spheres[i].radius,
            ray
        );

        if (_distance < distance) {
            distance = _distance;
            hitIndex = i;
        }
    }

    if (hitIndex == -1) {
        // return vec3(0.0, 0.0, 0.0);

        return getSkyBoxHitColor(ray.direction);
    }

    vec3 hitPoint = ray.origin + ray.direction * distance;
    vec3 hitNormal = Sphere_getNormal(
        info.spheres[hitIndex].center,
        info.spheres[hitIndex].radius,
        hitPoint
    );
    float cos = -dot(ray.direction, hitNormal);
    float distanceFactor = min(1.0, pow(distance / info.spheres[hitIndex].radius, -2.0));

    vec3 hitColor = getTextureTexel(
        info.spheres[hitIndex].textureIndex,
        getUV(hitNormal, info.spheres[hitIndex].angles),
        // 1.0,
        info.spheres[hitIndex].color
    ).xyz;

    // Fake depth texture
    // hitNormal = normalize(hitNormal + hitColor * 0.5);
    // hitColor = info.spheres[hitIndex].color;

    if (hitIndex < info.lightsCount) {
        return hitColor/*  * info.spheres[hitIndex].color */ * cos * (0.05 + distanceFactor);
    }

    vec3 reflectColor = getHitReflectColor(hitPoint, distance, hitColor, hitIndex, hitNormal, false);

    return (hitColor * 0.01 * distanceFactor + reflectColor) * cos;
}

void main() {
    float m = info.sizes.x > info.sizes.y ? info.sizes.x : info.sizes.y;
    vec3 rp = vec3((gl_FragCoord.xy - (info.sizes * 0.5)) / m, info.d);

    vec3 dir3 = info.rotationMatrix * rp;

    Ray ray = Ray(vec3(0.0, 0.0, 0.0), normalize(dir3));

    // vec3 rawColor = getHitColor(ray);
    vec3 rawColor = getHitColorWithAtmosphere(ray);

    rawColor = pow(rawColor, vec3(1.0/2.2, 1.0/2.2, 1.0/2.2));

    float maxPart = max(rawColor.x, max(rawColor.y, rawColor.z));

    if (maxPart > 1.0) {
        rawColor /= maxPart;
    }

    color = vec4(rawColor, 1.0);
}

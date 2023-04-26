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

float Sphere_getRayDistance(Sphere s, Ray ray) {
    vec3 toSphere = ray.origin - s.center;

    if (length(toSphere) < s.radius) {
        return 0.0;
    }

    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(toSphere, ray.direction);
    float c = dot(toSphere, toSphere) - s.radius*s.radius;
    float discriminant = b*b - 4.0*a*c;

    if(discriminant > 0.0) {
        float t = (-b - sqrt(discriminant)) / (2.0 * a);
        if(t > 0.0) return t;
    }

    return info.viewDistance;
}

// float Sphere_getRayDistance(Sphere s, Ray ray) {
//     vec3 toSphere = ray.origin - s.center;

//     float a = dot(ray.direction, ray.direction);
//     float b = 2.0 * dot(toSphere, ray.direction);
//     float c = dot(toSphere, toSphere) - s.radius*s.radius;
//     float discriminant = b*b - 4.0*a*c;


//     if (discriminant < 0.0) {
//       return info.viewDistance;
//     }

//     discriminant = sqrt(discriminant);
//     float t = -b - discriminant;

//     if (t > 0.0001) {
//         return t / 2.0;
//     }

//     t = -b + discriminant;
//     if (t > 0.0001) {
//         return t / 2.0;
//     }

//     return info.viewDistance;
// }

vec3 Sphere_getNormal(Sphere s, vec3 hitPoint) {
    return (hitPoint - s.center) / s.radius;
    // vec3 result = (hitPoint - s.center) / s.radius;

    // float m = 1.0;

    // result.x += (result.y + result.z) * m;
    // result.y += (result.x + result.z) * m;
    // result.z += (result.y + result.x) * m;

    // return result;
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

    // return vec2(
    //     getPositiveModulo(
    //         0.5 + (angles.x + atan(normal.z, normal.x)) / M_PI2,
    //         1.0
    //     ),
    //     getPositiveModulo(
    //         (angles.y + atan(sqrt(normal.x * normal.x + normal.z * normal.z), normal.y)) / M_PI,
    //         1.0
    //     )
    // );
}


vec3 getHitColor(Ray ray) {
    int hitIndex = -1;
    float distance = info.viewDistance;
    for (int i=0; i<info.count; ++i) {
        float _distance = Sphere_getRayDistance(info.spheres[i], ray);

        if (_distance < distance) {
            distance = _distance;
            hitIndex = i;
        }
    }

    if (hitIndex == -1) {
        // return vec3(0.0, 0.0, 0.0);

        vec3 result = getTextureTexel(
            0,
            getUV(ray.direction, vec2(0.0, 0.0)),
            // 1.0,
            vec3(0.0, 0.0, 0.0)
        ).xyz;

        if (length(result) > 0.9) {
            // return result;
            return vec3(0.1, 0.1, 0.1);
        } else {
            return vec3(0.0, 0.0, 0.0);
        }

        // vec2 uv = getUV(ray.direction, vec2(0.0, 0.0));

        // if (int(uv.x * 10000.0) % 11 == 0 && int(uv.y * 100000.0) % 11 == 0) {
        //     return vec3(1.0, 1.0, 1.0);
        // } else {
        //     return vec3(0.0, 0.0, 0.0);
        // }
    }

    vec3 hitPoint = ray.origin + ray.direction * distance;
    vec3 hitNormal = Sphere_getNormal(info.spheres[hitIndex], hitPoint);
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
        return hitColor * info.spheres[hitIndex].color * cos * (0.05 + distanceFactor);
    }

    vec3 reflectColor = vec3(0.0, 0.0, 0.0);

    for (int j=0; j<info.lightsCount; ++j) {
        Ray lightRay = Ray(hitPoint, normalize(info.spheres[j].center - hitPoint));
        float lightCos = dot(lightRay.direction, hitNormal);

        if (lightCos < 0.0) {
            continue;
        }

        float lightDistance = Sphere_getRayDistance(info.spheres[j], lightRay);

        bool inDark = false;

        for (int i=info.lightsCount; i<info.count; ++i) if (i != hitIndex) {
            float _distance = Sphere_getRayDistance(info.spheres[i], lightRay);
    
            if (_distance < lightDistance) {
                inDark = true;
                break;
            }
        }

        if (!inDark) {
            float lightDistanceFactor = min(1.0, pow(lightDistance / info.spheres[j].radius, -2.0));
            // TODO
            // float viewDistanceFactor = min(1.0, pow(distance / info.spheres[j].radius, -2.0));
            reflectColor += hitColor * info.spheres[j].color * lightCos * (lightDistanceFactor /* * viewDistanceFactor */);
        }
    }

    return (hitColor * 0.01 * distanceFactor + reflectColor) * cos;
}

void main() {
    float m = info.sizes.x > info.sizes.y ? info.sizes.x : info.sizes.y;
    vec3 rp = vec3((gl_FragCoord.xy - (info.sizes * 0.5)) / m, info.d);

    vec3 dir3 = info.rotationMatrix * rp;

    Ray ray = Ray(vec3(0.0, 0.0, 0.0), normalize(dir3));

    vec3 rawColor = getHitColor(ray);

    rawColor = pow(rawColor, vec3(1.0/2.2, 1.0/2.2, 1.0/2.2));

    // rawColor = clamp(rawColor, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));

    float maxPart = max(rawColor.x, max(rawColor.y, rawColor.z));

    if (maxPart > 1.0) {
        rawColor /= maxPart;
    }

    color = vec4(rawColor, 1.0);
}

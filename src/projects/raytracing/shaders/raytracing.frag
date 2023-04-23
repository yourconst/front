#version 300 es
#ifdef GL_ES
precision mediump float;
#endif

struct Sphere {
    vec3 center;
    float radius;
    vec3 color;
};

uniform Info {
    vec3 origin;
    vec2 directionXZ;
    vec2 directionYZ;
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

float Sphere_getRayDistance(Sphere s, Ray ray) {
    vec3 toSphere = ray.origin - s.center;

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

vec3 Sphere_getNormal(Sphere s, vec3 hitPoint) {
    return (hitPoint - s.center) / s.radius;
    // vec3 result = (hitPoint - s.center) / s.radius;

    // float m = 1.0;

    // result.x += (result.y + result.z) * m;
    // result.y += (result.x + result.z) * m;
    // result.z += (result.y + result.x) * m;

    // return result;
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
        return vec3(0.0, 0.0, 0.0);
    }

    vec3 color = info.spheres[hitIndex].color;
    vec3 hitPoint = ray.origin + ray.direction * distance;
    vec3 hitNormal = Sphere_getNormal(info.spheres[hitIndex], hitPoint);
    color *= -dot(ray.direction, hitNormal); // * dot(ray.direction, hitNormal);

    if (hitIndex < info.lightsCount) {
        return color;
    }

    color *= 0.1;

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

        if (!inDark)
        color *= (1.0 + info.spheres[j].color * lightCos * pow(info.spheres[j].radius / lightDistance, 0.5));
    }

    return color;
}

void main() {
    float m = info.sizes.x > info.sizes.y ? info.sizes.x : info.sizes.y;
    vec3 rp = vec3((gl_FragCoord.xy - (info.sizes * 0.5)) / m, info.d);

    vec3 dir3 = vec3(
        rp.x * info.directionXZ.x - rp.z * info.directionXZ.y,
        0.0,
        rp.x * info.directionXZ.y + rp.z * info.directionXZ.x
    );

    float z = dir3.z;

    dir3.y = rp.y * info.directionYZ.x - z * info.directionYZ.y;
    dir3.z = rp.y * info.directionYZ.y + z * info.directionYZ.x;

    Ray ray = Ray(info.origin, normalize(dir3));

    color = vec4(getHitColor(ray), 1.0);
}

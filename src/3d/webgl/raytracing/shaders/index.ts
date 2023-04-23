const vertexData = new Float32Array([
    -1.0,
    1.0, // top left
    -1.0,
    -1.0, // bottom left
    1.0,
    1.0, // top right
    1.0,
    -1.0 // bottom right
]);

const vertexSource = `
#version 300 es
in vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentSource = `
#version 300 es
#ifdef GL_ES
precision lowp float;
#endif

struct Sphere {
    vec3 center;
    float radius;
    vec3 color;
};

uniform Info {
    vec3 origin;
    vec2 directionXZ;
    vec2 sizes;
    float d;
    float viewDistance;
    int lightsCount;
    int count;
    Sphere lights[4];
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

    vec3 color = info.spheres[hitIndex].color * 0.1;
    vec3 hitPoint = ray.origin + ray.direction * distance;
    vec3 hitNormal = Sphere_getNormal(info.spheres[hitIndex], hitPoint);
    color *= -dot(ray.direction, hitNormal);

    for (int j=0; j<info.lightsCount; ++j) {
        Ray lightRay = Ray(hitPoint, normalize(info.lights[j].center - hitPoint));
        float lightCos = dot(lightRay.direction, hitNormal);

        if (lightCos < 0.0) {
            continue;
        }

        float lightDistance = Sphere_getRayDistance(info.lights[j], lightRay);

        bool inDark = false;

        for (int i=0; i<info.count; ++i) if (i != hitIndex) {
            float _distance = Sphere_getRayDistance(info.spheres[i], lightRay);
    
            if (_distance < lightDistance) {
                inDark = true;
                break;
            }
        }

        if (!inDark)
        color *= (1.0 + info.lights[j].color * lightCos);
    }

    return color;
}

void main() {
    float m = info.sizes.x > info.sizes.y ? info.sizes.x : info.sizes.y;
    vec2 rp = (gl_FragCoord.xy - (info.sizes * 0.5)) / m / info.d;

    vec3 dir3 = vec3(
        rp.x * info.directionXZ.x - 1.0 * info.directionXZ.y,
        rp.y,
        rp.x * info.directionXZ.y + 1.0 * info.directionXZ.x
    );

    Ray ray = Ray(info.origin, dir3);

    color = vec4(getHitColor(ray), 1.0);
}`;

export const vertex = {
    data: vertexData,
    source: vertexSource,
};

export const fragment = {
    source: fragmentSource,
};

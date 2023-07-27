vec3 getRelativeDirection(const vec3 ap, const vec3 rotation) {
    // return transpose(rotation) * ap;
    vec3 r_;

    float cosz = cos(rotation.z), sinz = -sin(rotation.z);
    r_.xy = mat2(cosz, sinz, -sinz, cosz) * ap.xy;
    float cosy = cos(rotation.y), siny = -sin(rotation.y);
    r_.xz = mat2(cosy, siny, -siny, cosy) * vec2(r_.x, ap.z);
    float cosx = cos(rotation.x), sinx = -sin(rotation.x);
    r_.yz = mat2(cosx, sinx, -sinx, cosx) * r_.yz;

    return r_;
}
vec3 getRelativePoint(const vec3 ap, const vec3 rotation, const vec3 center) {
    return getRelativeDirection(ap - center, rotation);
}

vec3 getAbsoluteDirection(const vec3 rp, const vec3 rotation) {
    // return rotation * rp;
    vec3 r_;

    float cosx = cos(rotation.x), sinx = sin(rotation.x);
    r_.yz = mat2(cosx, sinx, -sinx, cosx) * rp.yz;
    float cosy = cos(rotation.y), siny = sin(rotation.y);
    r_.xz = mat2(cosy, siny, -siny, cosy) * vec2(rp.x, r_.z);
    float cosz = cos(rotation.z), sinz = sin(rotation.z);
    r_.xy = mat2(cosz, sinz, -sinz, cosz) * r_.xy;

    return r_;
}
vec3 getAbsolutePoint(const vec3 rp, vec3 rotation, const vec3 center) {
    return getAbsoluteDirection(rp, rotation) + center;
}


struct Rotation {
    vec2 x;
    vec2 y;
    vec2 z;
};
vec3 getRelativeDirection(const vec3 ap, const Rotation rotation) {
    vec3 r_;
    r_.xy = mat2(rotation.z.x, -rotation.z.y, rotation.z.y, rotation.z.x) * ap.xy;
    r_.xz = mat2(rotation.y.x, -rotation.y.y, rotation.y.y, rotation.y.x) * vec2(r_.x, ap.z);
    r_.yz = mat2(rotation.x.x, -rotation.x.y, rotation.x.y, rotation.x.x) * r_.yz;
    return r_;
}
vec3 getAbsoluteDirection(const vec3 rp, const Rotation rotation) {
    vec3 r_;
    r_.yz = mat2(rotation.x.x, rotation.x.y, -rotation.x.y, rotation.x.x) * rp.yz;
    r_.xz = mat2(rotation.y.x, rotation.y.y, -rotation.y.y, rotation.y.x) * vec2(rp.x, r_.z);
    r_.xy = mat2(rotation.z.x, rotation.z.y, -rotation.z.y, rotation.z.x) * r_.xy;
    return r_;
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

float random(vec3 scale, float seed) {
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

vec3 cosineWeightedDirection(float seed, vec3 normal) {
    float u = random(vec3(12.9898, 78.233, 151.7182), seed);
    float v = random(vec3(63.7264, 10.873, 623.6736), seed);
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

vec3 uniformlyRandomDirection(float seed) {
    float u = random(vec3(12.9898, 78.233, 151.7182), seed);
    float v = random(vec3(63.7264, 10.873, 623.6736), seed);
    float z = 1.0 - 2.0 * u;
    float r = sqrt(1.0 - z * z);
    float angle = 6.283185307179586 * v;
    return vec3(r * cos(angle), r * sin(angle), z);
}

            // normalize(info.spheres[j].center +
            //     info.spheres[j].radius *
            //         uniformlyRandomDirection(hitColor.x + hitColor.y + hitColor.z + cos) -
            //     hitPoint
            // )



float getModulo(float n, float base) {
    return n - float(base * float(int(n / base)));
}

float getPositiveModulo(float n, float base) {
    return getModulo(getModulo(n, base) + base, base);
}



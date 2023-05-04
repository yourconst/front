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

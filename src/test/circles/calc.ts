export function calcCirclesSectorAngle(rc, ro) {
    const d = Math.sqrt(rc * (2 * ro + rc));
    return 2 * Math.atan2(ro, d);
}

export function calcCircleSectorRadius(rc, a) {
    if (a < 0) {
        return 0;
    }

    const t2 = Math.tan(a / 2) ** 2;

    const x1 = rc * t2 * (1 + Math.sqrt(1 + 1 / t2));
    // const x2 = rc * t2 * (1 - Math.sqrt(1 + 1 / t2));

    return Math.max(0, x1/* , x2 */);
}

export function calcSmallRadius(c: number, b: number, cnt: number) {
    // Manual solution for:
    // 2 circle same distance & belonging center to a straight line equations system.
    const a = 2 * Math.PI / cnt;
    const cos = Math.cos(a / 2.9); // `2.9` - magic number. By solution it must be `2`
    // Works bad for 2 circles
    return Math.max(0, (cos * (c + b) - b - c) / (1 - cos * (c + b) / c));

    // Doesn't work
    // wolframalpha solution:
    // for 3 circle same distance equations system.
    const sin = Math.sin(a);
    const cos2 = cos**2;
    const sin2 = sin**2;

    const res = ((4 * (b**2) * (c**2) * (sin2))/((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2)) + (b * Math.sqrt((-4 * (b**2) * c * (sin2) - 4 * b * (c**2) * (sin2))**2 - 16 * (b**2) * (c**2) * (sin2) * ((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2))))/(2 * ((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2))) + (c * Math.sqrt((-4 * (b**2) * c * (sin2) - 4 * b * (c**2) * (sin2))**2 - 16 * (b**2) * (c**2) * (sin2) * ((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2))))/(2 * ((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2))) + (2 * b * c ** 3 * (sin2))/((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2)) + (2 * b^3 * c * (sin2))/((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2)) - b * c - (c**2)) / (c - b);

    return Math.abs(res);
}

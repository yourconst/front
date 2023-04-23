function rand(max = 1, min = 0) {
    return min + Math.random() * (max - min);
}

export class Vector3 {
    static createRandom(max = 1, min = 0) {
        return new Vector3(rand(max, min), rand(max, min), rand(max, min));
    }

    constructor(public x = 0, public y = 0, public z = 0) { }

    set(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
}

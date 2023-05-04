import type { Geometry3 } from "../geometry/Geometry3";
import { Ray3 } from "../math/Ray3";
import { Sphere } from "../geometry/Sphere";
import { Matrix3x3 } from "../math/Matrix3x3";
import { Vector2 } from "../math/Vector2";
import { Vector3 } from "../math/Vector3";
import { RigidBody3, type RigidBody3Options } from "../physics/RigidBody3";

export interface Camera3Options {
    origin?: Vector3;
    angles?: Vector3;
    exposure?: number;
    d?: number;
    distance?: number;
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export class Camera3 {
    static createWithBody(
        options: Camera3Options = {},
        bodyOptions: Optional<RigidBody3Options, 'geometry'> = {},
    ) {
        const camera = new Camera3({
            origin: bodyOptions.geometry?.center,
            ...options,
        });

        bodyOptions.geometry ??= new Sphere({
            center: camera.origin,
            radius: 0.3,
            angles: camera.angles,
        });

        return {
            camera,
            body: new RigidBody3(<RigidBody3Options> bodyOptions),
        };
    }

    origin: Vector3;
    angles: Vector3;
    exposure: number;
    d: number;
    distance: number;
    
    sizes = new Vector2(1920, 1080);

    constructor(options: Camera3Options) {
        this.origin = options.origin ?? new Vector3();
        this.angles = options.angles ?? new Vector3();
        this.exposure = options.exposure || 2.2;
        this.d = options.d || 1;
        this.distance = options.distance || Infinity;
    }

    getHalfSizes() {
        return this.sizes.clone().multiplyN(0.5); 
    }

    get aspectRatio() {
        return this.sizes.x / this.sizes.y;
    }

    get minSize() {
        return this.sizes.min();
    }

    getRelativeHalfSizes() {
        return this.getHalfSizes().divideN(this.minSize);
    }

    lookAt(point: Vector3) {
        const angles = point.clone().minus(this.origin).normalize().angles();

        this.angles.x = angles.y - Math.PI / 2;
        this.angles.y = angles.x - Math.PI / 2;

        return this;
    }

    getDirection() {
        const angles = this.angles.clone();
        // angles.x *= -1;
        return new Vector3(0, 0, 1).rotateZXY(angles);
    }

    getCenterRay() {
        return new Ray3(this.origin.clone(), this.getDirection());
    }

    getRotationMatrix3x3() {
        const angles = this.angles.clone();
        angles.x *= -1;
        return Matrix3x3.createRotationFromAnglesZXY(angles);
    }

    getInversionMultiplier() {
        return (Math.abs(this.angles.x) + Math.PI / 2) % (2 * Math.PI) > Math.PI ? -1 : 1;
    }

    pyramidMultiplier = 1;

    _getViewPyramidConfig() {
        const rhs = this.getRelativeHalfSizes();
        const bv = new Vector3(rhs.x, rhs.y, this.d * this.pyramidMultiplier);

        return {
            centerRay: this.getCenterRay(),
            cornerDirs: <[Vector3, Vector3, Vector3]> [
                bv.clone().multiplyX(-1).rotateZXY(this.angles).normalize(),
                bv.clone().rotateZXY(this.angles).normalize(),
                bv.clone().multiplyY(-1).rotateZXY(this.angles).normalize(),
            ],
        };
    }

    _getViewPyramidByConfig(config: {
        centerRay: Ray3;
        cornerDirs: [Vector3, Vector3, Vector3];
    }) {
        return new Camera3ViewPyramid(
            config.centerRay,
            config.cornerDirs,
        ); 
    }

    _getViewBiPyramidByConfig(config: {
        maxDepth: number;
        centerRay: Ray3;
        cornerDirs: [Vector3, Vector3, Vector3];
    }) {
        return new Camera3ViewBiPyramid(
            config.maxDepth,
            config.centerRay,
            config.cornerDirs,
        ); 
    }

    getViewPyramid() {
        return this._getViewPyramidByConfig(
            this._getViewPyramidConfig(),
        );
    }

    getViewBiPyramid(maxDepth: number) {
        return this._getViewBiPyramidByConfig({
            maxDepth,
            ...this._getViewPyramidConfig(),
        });
    }
}

export class Camera3ViewPyramid {
    readonly origin: Vector3;
    readonly cos: number;
    readonly cornerRays: [Ray3, Ray3, Ray3];

    constructor(
        centralRay: Ray3,
        cornerDirs: [Vector3, Vector3, Vector3],
    ) {
        this.origin = centralRay.origin;
        this.cos = centralRay.direction.dot(cornerDirs[0]);

        this.cornerRays = [
            new Ray3(this.origin, cornerDirs[0]),
            new Ray3(this.origin, cornerDirs[1]),
            new Ray3(this.origin, cornerDirs[2]),
        ];
    }
    
    getDepthPlane(depth: number) {
        const rd = depth / this.cos;

        return new Parallelogram3([
            this.cornerRays[0].getPointByDistance(rd),
            this.cornerRays[1].getPointByDistance(rd),
            this.cornerRays[2].getPointByDistance(rd),
        ]);
    }
}

export class Camera3ViewBiPyramid {
    readonly cos: number;
    readonly straightOrigin: Vector3;
    readonly reverseOrigin: Vector3;
    readonly straightRays: [Ray3, Ray3, Ray3];
    readonly reverseRays: [Ray3, Ray3, Ray3];
    readonly reverseSubDepth: number;

    constructor(
        public readonly maxDepth: number,
        centralRay: Ray3,
        cornerDirs: [Vector3, Vector3, Vector3],
    ) {
        this.cos = centralRay.direction.dot(cornerDirs[0]);

        this.straightOrigin = centralRay.origin;

        this.straightRays = [
            new Ray3(this.straightOrigin, cornerDirs[0]),
            new Ray3(this.straightOrigin, cornerDirs[1]),
            new Ray3(this.straightOrigin, cornerDirs[2]),
        ];

        this.reverseOrigin = centralRay.getPointByDistance(this.maxDepth);

        this.reverseSubDepth = this.reverseOrigin.distanceTo(
            this.straightRays[0].getPointByDistance(this.maxDepth),
        );

        this.reverseRays = [
            this.reverseOrigin.getRayToPoint(this.straightRays[0].getPointByDistance(this.maxDepth)),
            this.reverseOrigin.getRayToPoint(this.straightRays[1].getPointByDistance(this.maxDepth)),
            this.reverseOrigin.getRayToPoint(this.straightRays[2].getPointByDistance(this.maxDepth)),
        ];
    }

    getDepthPlane(depth: number) {
        let rd = depth / this.cos;

        if (rd > this.maxDepth) {
            const percent = (1 - depth / this.maxDepth) / (1 - this.cos);
            const rsd = percent * this.reverseSubDepth;

            return new Parallelogram3([
                this.reverseRays[0].getPointByDistance(rsd),
                this.reverseRays[1].getPointByDistance(rsd),
                this.reverseRays[2].getPointByDistance(rsd),
            ]);
        }

        return new Parallelogram3([
            this.straightRays[0].getPointByDistance(rd),
            this.straightRays[1].getPointByDistance(rd),
            this.straightRays[2].getPointByDistance(rd),
        ]);
    }
}

export class Parallelogram3 {
    readonly base: Vector3;
    readonly hv: Vector3;
    readonly vv: Vector3;
    readonly sizes: Vector2;

    constructor(corners: [Vector3, Vector3, Vector3]) {
        this.base = corners[0].clone();
        this.hv = corners[1].clone().minus(corners[0]);
        this.vv = corners[2].clone().minus(corners[1]);
        this.sizes = new Vector2(
            this.hv.length(),
            this.vv.length(),
        );
        this.hv.normalize();
        this.vv.normalize();
    }

    getPoint(x: number, y: number) {
        return this.hv.clone().multiplyN(x)
            .plus(this.vv.clone().multiplyN(y))
            .plus(this.base);
    }
}

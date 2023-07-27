import { DrawableCube } from "../../drawableGeometry/DrawableCube";
import { DrawableSphere } from "../../drawableGeometry/DrawableSphere";
import { Vector3 } from "../../math/Vector3";
import type { Body3 } from "../Body3";

class Pair<F, S = F> {
    constructor(public first: F, public second: S) { }
}

interface Body3BindingOptions {
    body: Body3;
    relativePoint?: Vector3;
}

export class Body3Binding {
    readonly body: Body3;
    readonly offset: Vector3;

    constructor(options: Body3BindingOptions) {
        this.body = options.body;
        this.offset = options.relativePoint?.clone() || new Vector3();
    }

    getPoint() {
        return this.body.geometry.getAbsolutePoint(this.offset);
    }
}

export interface JointLengthInfo {
    max: number;
    base: number;
}

export interface Joint3Options extends Pair<Body3BindingOptions> {
    length?: Partial<JointLengthInfo>;
}

export abstract class Joint3 {
    private _destroyed = false;
    length: JointLengthInfo;
    readonly bindings: Pair<Body3Binding>;

    constructor(options: Joint3Options) {
        this.bindings = new Pair(
            new Body3Binding(options.first),
            new Body3Binding(options.second),
        );

        // @ts-ignore
        this.length = {};

        this.length.base = options.length?.base || this.getLength();
        this.length.max = options.length?.max || this.length.base * 5.5;
    }

    getPoints() {
        return new Pair(this.bindings.first.getPoint(), this.bindings.second.getPoint());
    }

    getRadiusVector(points = this.getPoints()) {
        return points.second.clone().minus(points.first);
    }

    getLength(points = this.getPoints()) {
        return points.first.distanceTo(points.second);
    }

    getStretch(length = this.getLength()) {
        return (length - this.length.base) / ((this.length.max - this.length.base) || 1);
    }

    isDestroyed(points?: Pair<Vector3>) {
        if (this._destroyed) {
            return true;
        }

        if (this.length.max && this.length.max < this.getLength(points)) {
            this._destroyed = true;
            return true;
        }

        return false;
    }



    abstract update(): boolean;

    getMinRadius() {
        return Math.min(this.bindings.first.body.geometry.radius, this.bindings.second.body.geometry.radius);
    }

    getGeometry() {
        const p = this.getPoints();
        return DrawableCube.createJoint({
            p0: p.first,
            p1: p.second,
            width: 0.1, // this.getMinRadius() * Math.abs(Math.max(0.1, 1 - this.getStretch())),
            color: new Vector3(1, 0, 0),
        })
    }

    getGeometries() {
        const p = this.getPoints();
        return [
            new DrawableSphere({
                center: p.first,
                radius: 0.2,
                color: new Vector3(1, 0, 0),
            }),
            new DrawableSphere({
                center: p.second,
                radius: 0.2,
                color: new Vector3(1, 0, 0),
            }),
        ];
    }
}

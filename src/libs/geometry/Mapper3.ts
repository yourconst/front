import { AABB3 } from "../math/AABB3";
import type { Vector3 } from "../math/Vector3";
import type { Collision, Geometry3 } from "./Geometry3"
import type { Ray3 } from "../math/Ray3";

interface MappedObject3 {
    geometry: Geometry3;
    // _lastMapperCheckId?: number;
}

// TODO
export class Mapper3<O extends MappedObject3> {
    private readonly all = new Set<O>();
    private readonly map: Set<O>[];
    private readonly counts: Vector3;

    constructor(public aabb: AABB3, public steps: Vector3) {
        this.counts = this.aabb.getSize().divide(steps).ceil();

        const count = this.counts.x * this.counts.y * this.counts.z || 1;
        // console.log(aabb, steps, count);
        this.map = new Array(count);

        for (let i = 0; i < count; ++i) {
            this.map[i] = new Set();
        }
    }

    clear() {
        for (const cell of this.map) {
            cell.clear();
        }

        return this;
    }

    private _getCellN(x: number, y: number, z: number) {
        const index = y * this.counts.x * this.counts.z + z * this.counts.x + x;
        // console.log(x, y, z);
        // console.log(index);
        // console.log(this.map, this.map[index]);
        return this.map[index];
    }

    private _getCell(v: Vector3) {
        // return this.map[v.y * this.counts.x * this.counts.z + v.z * this.counts.x + v.x];
        return this._getCellN(v.x, v.y, v.z);
    }

    private getInnerCoords(position: Vector3) {
        const result = position.clone().minus(this.aabb.min).divide(this.steps)/* .trunc() */;

        result.x = Math.trunc(Math.max(0, Math.min(this.counts.x - 1, result.x)));
        result.y = Math.trunc(Math.max(0, Math.min(this.counts.y - 1, result.y)));
        result.z = Math.trunc(Math.max(0, Math.min(this.counts.z - 1, result.z)));

        return result;
    }

    private getInnerAABB(aabb: AABB3) {
        return new AABB3(
            this.getInnerCoords(aabb.min),
            this.getInnerCoords(aabb.max),
        );
    }

    addMany(os: Iterable<O>) {
        for (const o of os) {
            this.add(o);
        }

        return this;
    }

    add(o: O) {
        const iaabb = this.getInnerAABB(o.geometry.recalcAABB());

        // console.log(iaabb);

        for (let z = iaabb.min.z; z <= iaabb.max.z; ++z) {
            for (let y = iaabb.min.y; y <= iaabb.max.y; ++y) {
                for (let x = iaabb.min.x; x <= iaabb.max.x; ++x) {
                    this._getCellN(x, y, z).add(o);
                }
            }
        }

        this.all.add(o);

        return this;
    }

    remove(o: O) {
        const iaabb = this.getInnerAABB(o.geometry.aabb);

        for (let z = iaabb.min.z; z <= iaabb.max.z; ++z) {
            for (let y = iaabb.min.y; y <= iaabb.max.y; ++y) {
                for (let x = iaabb.min.x; x <= iaabb.max.x; ++x) {
                    this._getCellN(x, y, z).delete(o);
                }
            }
        }

        this.all.delete(o);

        return this;
    }

    update(o: O) {
        const aabb0 = o.geometry.getAABB().clone();
        const aabb1 = o.geometry.recalcAABB();

        // if (!o['name']) {
        //     console.log(aabb0, aabb1);
        // }

        const iaabb0 = this.getInnerAABB(aabb0);
        const iaabb1 = this.getInnerAABB(aabb1);

        if (iaabb0.isEquals(iaabb1)) {
            return;
        }

        for (let z = iaabb0.min.z; z <= iaabb0.max.z; ++z) {
            for (let y = iaabb0.min.y; y <= iaabb0.max.y; ++y) {
                for (let x = iaabb0.min.x; x <= iaabb0.max.x; ++x) {
                    this._getCellN(x, y, z).delete(o);
                }
            }
        }

        for (let z = iaabb1.min.z; z <= iaabb1.max.z; ++z) {
            for (let y = iaabb1.min.y; y <= iaabb1.max.y; ++y) {
                for (let x = iaabb1.min.x; x <= iaabb1.max.x; ++x) {
                    this._getCellN(x, y, z).add(o);
                }
            }
        }
        
        return this;
    }

    getAll() {
        return [...this.all];
    }


    getByPoint(point: Vector3) {
        const ip = this.getInnerCoords(point);
        return [...this._getCell(ip)];
    }

    getByAABB(aabb: AABB3) {
        const result = new Set<O>();
        const iaabb = this.getInnerAABB(aabb);

        for (let z = iaabb.min.z; z <= iaabb.max.z; ++z) {
            for (let y = iaabb.min.y; y <= iaabb.max.y; ++y) {
                for (let x = iaabb.min.x; x <= iaabb.max.x; ++x) {
                    for (const entity of this._getCellN(x, y, z)) {
                        result.add(entity);
                    }
                }
            }
        }

        return result;
    }

    getByObject(o: O) {
        const res = this.getByAABB(o.geometry.aabb);
        res.delete(o);
        return res;
    }

    // TODO: implementation
    tryGetClosestTo(o: MappedObject3) {
        let distance = Infinity;
        let result: O = null;

        for (const object of this.all) {
            if (object === o) {
                continue;
            }

            const _distance = o.geometry.getSignedDistanceTo(object.geometry);

            if (_distance < distance) {
                distance = _distance;
                result = object;
            }
        }

        return result;
    }

    // TODO: implementation
    tryGetFirstRayIntersected(ray: Ray3, except?: O) {
        let distance = Infinity;
        let result: O;

        for (const object of this.all) if (object !== except) {
            const _distance = object.geometry.getRayDistance(ray);

            if (_distance < distance) {
                distance = _distance;
                result = object;
            }
        }

        return {
            distance,
            object: result,
        };
    }

    getCollidedWithInfo(o: O) {
        const result: (Collision & {
            object: O;
        })[] = [];
        
        const byAabb = this.getByObject(o);

        for (const object of byAabb) {
            const info = o.geometry.getCollision(object.geometry);

            if (!info.isCollided) {
                continue;
            }
            
            result.push({
                ...info,
                object,
            });
        }

        return result;
    }
}

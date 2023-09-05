import type { Vector2 } from '../math/Vector2';
import { AABB2 } from '../math/AABB2';
import type { Geometry2 } from './Geometry2';

export class Mapper2<E extends { geometry: Geometry2; }> {
    private readonly map: Set<E>[];
    private readonly counts: Vector2;

    constructor(public aabb: AABB2, public steps: Vector2) {
        this.counts = this.aabb.getSize().divide(steps).ceil();

        this.map = new Array(this.counts.x * this.counts.y);

        for (let i = 0; i < this.counts.x * this.counts.y; ++i) {
            this.map[i] = new Set();
        }
    }

    clear() {
        for (const cell of this.map) {
            cell.clear();
        }
    }

    private getCell(x: number, y: number) {
        return this.map[y * this.counts.x + x];
    }

    private getInnerCoords(position: Vector2) {
        const result = position.clone().minus(this.aabb.min).divide(this.steps)/* .trunc() */;

        result.x = Math.trunc(Math.max(0, Math.min(this.counts.x - 1, result.x)));
        result.y = Math.trunc(Math.max(0, Math.min(this.counts.y - 1, result.y)));

        return result;
    }

    private getInnerAABB(aabb: AABB2) {
        return new AABB2(
            this.getInnerCoords(aabb.min),
            this.getInnerCoords(aabb.max),
        );
    }

    addMany(entities: Iterable<E>) {
        for (const entity of entities) {
            this.add(entity);
        }
    }

    add(entity: E) {
        const iaabb = this.getInnerAABB(entity.geometry.aabb);

        for (let y = iaabb.min.y; y <= iaabb.max.y; ++y) {
            for (let x = iaabb.min.x; x <= iaabb.max.x; ++x) {
                this.getCell(x, y).add(entity);
            }
        }
    }

    delete(entity: E) {
        const iaabb = this.getInnerAABB(entity.geometry.aabb);

        for (let y = iaabb.min.y; y <= iaabb.max.y; ++y) {
            for (let x = iaabb.min.x; x <= iaabb.max.x; ++x) {
                this.getCell(x, y).delete(entity);
            }
        }
    }

    update(entity: E) {
        const iaabb0 = this.getInnerAABB(entity.geometry.aabb);
        const iaabb1 = this.getInnerAABB(entity.geometry.recalcAABB());

        if (iaabb0.isEquals(iaabb1)) {
            return;
        }

        for (let y = iaabb0.min.y; y <= iaabb0.max.y; ++y) {
            for (let x = iaabb0.min.x; x <= iaabb0.max.x; ++x) {
                this.getCell(x, y).delete(entity);
            }
        }

        for (let y = iaabb1.min.y; y <= iaabb1.max.y; ++y) {
            for (let x = iaabb1.min.x; x <= iaabb1.max.x; ++x) {
                this.getCell(x, y).add(entity);
            }
        }

        // entity.geometry.aabb = currentAABB;
    }

    getByPoint(point: Vector2) {
        const cell = this.getInnerCoords(point);

        return new Set([...this.map[cell.y * this.counts.x + cell.x]]);
    }

    getByAABB(aabb: AABB2) {
        const result = new Set<E>();
        const iaabb = this.getInnerAABB(aabb);

        for (let y = iaabb.min.y; y <= iaabb.max.y; ++y) {
            for (let x = iaabb.min.x; x <= iaabb.max.x; ++x) {
                for (const entity of this.getCell(x, y)) {
                    result.add(entity);
                }
            }
        }

        return result;
    }

    getByEntity(entity: E) {
        return this.getByAABB(entity.geometry.aabb);
    }
}

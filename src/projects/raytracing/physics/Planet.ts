import { DrawableSphere } from "../../../libs/drawableGeometry/DrawableSphere";
import type { Collision } from "../../../libs/geometry/Geometry3";
import { Vector3 } from "../../../libs/math/Vector3";
import { RigidBody3, type RigidBody3Options } from "../../../libs/physics/RigidBody3";
import { Body3, type Body3Options } from "../../../libs/physics/Body3";
import { Helpers } from "../../../helpers/common";
import { DrawableCube } from "../../../libs/drawableGeometry/DrawableCube";
import type { Camera3 } from "../../../libs/render/Camera3";
import type { IDrawableGeometry } from "../../../libs/drawableGeometry/DrawableGeometry";


type BlockKey = `${number};${number};${number}`;
type BlockInfo = {
    deleted: boolean;
    color: Vector3;
    relativePosition: Vector3;
};

interface BlockOptions extends Body3Options {
    parent: Planet;
    info: BlockInfo;
}

export class Block extends Body3 {
    parent: Planet;
    info: BlockInfo;

    constructor(options: BlockOptions) {
        super(options);
        this.parent = options.parent;
        this.info = options.info;

        const ml = this.geometry['color'].length();
        const pl = this.parent.geometry['color'].length();

        if (2 < pl) {
            this.geometry['color'].multiplyN(pl / ml);
        }
    }

    onCollide(body: Body3, info: Collision) {
        if (body === this.parent) {
            return false;
        }
        return super.onCollide(body, info);
    }

    remove() {
        this.parent.removeBlock(this.info.relativePosition);
        return this;
    }

    addBlockOnFace(normal: Vector3) {
        console.log(normal, this.geometry.getRelativeDirection(normal));

        this.parent.setBlock(
            this.geometry.getRelativeDirection(normal)
                .round()
                .plus(this.info.relativePosition),
        );
        return this;
    }

    highlight() {
        this.geometry['color'].multiplyN(2);
        return this;
    }
}

export interface PlanetOptions extends RigidBody3Options {
    blocksDistance?: number;
    showBlocksCount?: number;
    maxStoredBlocksCount?: number;
    seed?: number;
}

export class Planet extends RigidBody3 {
    blocksDistance: number;
    showBlocksCount: number;
    maxStoredBlocksCount: number;
    readonly seed: number;

    private storedBlocks = new Map<BlockKey, BlockInfo>();

    private player?: RigidBody3;

    constructor(options: PlanetOptions) {
        super(options);

        this.blocksDistance = options.blocksDistance ?? 14;
        this.showBlocksCount = options.showBlocksCount ?? 70;
        this.maxStoredBlocksCount = options.maxStoredBlocksCount ?? 100_000;
        this.seed = options.seed ?? Math.random();
    }

    private _pseed(p: Vector3, subseed = 0) {
        return this.seed +
            p.x * p.y * p.z + subseed +
            (p.x + subseed) * p.y + (p.x + subseed) * p.z + (p.y + subseed) * p.z +
            (p.x + subseed) * 0.248 + (p.y + subseed) * 0.47 + (p.z + subseed) * 0.73;
    }

    private _prandf(p: Vector3, subseed?: number) {
        return Helpers.pnrandf(this._pseed(p, subseed));
    }

    private _prandi30(p: Vector3, subseed?: number) {
        return Helpers.pnrandi30(this._pseed(p, subseed));
    }

    private _prandfv(p: Vector3, subseed = 0) {
        return new Vector3(
            Helpers.pnrandf(this._pseed(p, subseed + 11)),
            Helpers.pnrandf(this._pseed(p, subseed + 435)),
            Helpers.pnrandf(this._pseed(p, subseed + 84751)),
        );
    }

    _getCloneConfig(cloneGeometry = true): PlanetOptions {
        return {
            ...super._getCloneConfig(cloneGeometry),
            showBlocksCount: this.showBlocksCount,
            maxStoredBlocksCount: this.maxStoredBlocksCount,
            seed: this.seed,
        };
    }

    clone(cloneGeometry = true) {
        return new Planet(this._getCloneConfig(cloneGeometry));
    }

    setPlayer(player: RigidBody3) {
        this.player = player;
        return this;
    }

    onCollide(body: RigidBody3, info: Collision) {
        if (body === this.player) {
            return false;
        }

        return super.onCollide(body, info);
    }

    _getBlockKeyPosition(rp: Vector3) {
        const p = rp.clone().round();
        return {
            key: <BlockKey> `${p.x};${p.y};${p.z}`,
            relativePosition: p,
        };
    }

    private readonly _emptyBlockSubSeed = 123;
    private readonly _emptyBlockPercent = 0.1;
    private readonly _surfaceColorBlockDepth = 3;

    private _currentSurfaceColor: Vector3;

    _getNaturalBlock(rp: Vector3, info = this._getBlockKeyPosition(rp)) {
        if (
            this.geometry.radius < info.relativePosition.length() ||
            this._prandf(info.relativePosition, this._emptyBlockSubSeed) < this._emptyBlockPercent
        ) {
            return {
                deleted: true,
                color: new Vector3(0.5, 0.5, 0.5),
                relativePosition: info.relativePosition,
            };
        }

        return {
            deleted: false,
            color: this.geometry.radius - this._surfaceColorBlockDepth < info.relativePosition.length() ?
                this._currentSurfaceColor :
                this._prandfv(info.relativePosition),
            relativePosition: info.relativePosition,
        };
    }

    getBlock(rp: Vector3, info = this._getBlockKeyPosition(rp)): BlockInfo {
        let block = this.storedBlocks.get(info.key);

        if (!block) {
            return this._getNaturalBlock(rp, info);
        }

        return block;
    }

    setBlock(rp: Vector3, options: { deleted?: boolean; color?: Vector3 } = {}) {
        const info = this._getBlockKeyPosition(rp);
        const naturalBlock = this._getNaturalBlock(rp, info);
        let block = this.storedBlocks.get(info.key);

        options.deleted ??= false;
        options.color ??= naturalBlock.color;

        if (
            options.deleted === naturalBlock.deleted &&
            options.color.isEquals(naturalBlock.color)
        ) {
            this.storedBlocks.delete(info.key);
            block = naturalBlock;
        } else {
            if (block) {
                block.deleted = options.deleted;
                block.color = options.color;
            } else {
                block = {
                    deleted: options.deleted,
                    color: options.color,
                    relativePosition: info.relativePosition,
                };
                this.storedBlocks.set(info.key, block);
            }
        }

        return block;
    }

    removeBlock(rp: Vector3) {
        return this.setBlock(rp, { deleted: true });
    }

    private _currentCheckedBlockKeys = new Set<string>();
    private _tryGetFrameBlock(rp: Vector3) {
        const info = this._getBlockKeyPosition(rp);
        if (this._currentCheckedBlockKeys.has(info.key)) {
            return;
        }
        this._currentCheckedBlockKeys.add(info.key);

        const block = this.getBlock(info.relativePosition, info);

        if (block.deleted) {
            return;
        }

        return block;
    }

    getPlayerNearBlocks(camera: Camera3, player = this.player) {
        this.setPlayer(player);

        const result: BlockInfo[] = [];

        // console.log(rpc);
        
        const rpc = this.geometry.getRelativePoint(this.player.geometry.center);

        const dg: IDrawableGeometry = <any> this.geometry;

        if (dg.texture) {
            this._currentSurfaceColor = dg.texture.getPixelByUV(
                this.geometry.getRelativeDirection(rpc.clone().normalize())
                    .sphereNormalGetUV(),
            ).getXYZ();
        } else {
            this._currentSurfaceColor = dg.color;
        }

        // const rpc = this.player.geometry.center.clone()
        //     .minus(this.geometry.center)
        //     .rotateZYX(this.geometry.angles)
            // .minusN(rcount / 2, rcount / 2, rcount / 2);
        
        const config = camera._getViewPyramidConfig();

        config.centerRay.origin.set(this.geometry.getRelativePoint(config.centerRay.origin));
        config.centerRay.direction.set(this.geometry.getRelativeDirection(config.centerRay.direction));
        config.cornerDirs[0].set(this.geometry.getRelativeDirection(config.cornerDirs[0]));
        config.cornerDirs[1].set(this.geometry.getRelativeDirection(config.cornerDirs[1]));
        config.cornerDirs[2].set(this.geometry.getRelativeDirection(config.cornerDirs[2]));
        
        const viewPyramid = camera._getViewBiPyramidByConfig({
            maxDepth: this.blocksDistance,
            ...config,
        });

        this._currentCheckedBlockKeys.clear();
        let blockChecksCount = 0;

        const radius = 1.3;

        for (let x = rpc.x - radius; x <= rpc.x + radius; ++x) {
            for (let y = rpc.y - radius; y <= rpc.y + radius; ++y) {
                for (let z = rpc.z - radius; z <= rpc.z + radius; ++z) {
                    const block = this._tryGetFrameBlock(new Vector3(x, y, z));
                    block && result.push(block);
                }
            }
        }
        
        for (let d = 0; d < viewPyramid.maxDepth; ++d) {
            const dPlane = viewPyramid.getDepthPlane(d);
            // console.log('Sizes', dPlane.sizes);

            for (let dpx = -1; dpx <= dPlane.sizes.x + 1; dpx+=0.49) {
                // let prevDPPoint = dPlane.getPoint(dpx, -1);

                for (let dpy = -1; dpy <= dPlane.sizes.y + 1; dpy+=0.49) {
                    const curDPPoint = dPlane.getPoint(dpx, dpy);
                    // const min = curDPPoint.clone().minSet(prevDPPoint).trunc();
                    // const max = curDPPoint.clone().maxSet(prevDPPoint).ceil();
                    // prevDPPoint = curDPPoint;
                    // // console.log('min/max', min, max);

                    // for (let x = min.x; x <= max.x; ++x) {
                    //     for (let y = min.y; y <= max.y; ++y) {
                    //         for (let z = min.z; z <= max.z; ++z) {
                                // console.log(x, y, z, rpc);
                                ++blockChecksCount;
                                const block = this._tryGetFrameBlock(curDPPoint);
                                block && result.push(block);
                    //         }
                    //     }
                    // }

                }
            }
        }

        globalThis['blockChecksCount'] = blockChecksCount;
        
        // const h = 4;
        // const min = rpc.clone().minusN(h, h, h);
        // const max = rpc.clone().plusN(h, h, h);
        
        // outer: for (let x = min.x; x <= max.x; ++x) {
        //     for (let y = min.y; y <= max.y; ++y) {
        //         for (let z = min.z; z <= max.z; ++z) {
        //             const cur = new Vector3(x, y, z);

        //         // console.log(cur);

        //         const block = this.getBlock(cur);

        //         // console.log(block);

        //         if (block.deleted) {
        //             continue;
        //         }

        //         result.push(new Block({
        //             geometry: new DrawableCube({
        //                 center: block.relativePosition.clone().rotateXYZ(ra).plus(this.geometry.center),
        //                 color: block.color.clone(),
        //                 radius: 0.5,
        //                 angles: this.geometry.angles,
        //             }),
        //             parent: this,
        //             info: block,
        //         }));

        //         // if (result.length >= this.showBlocksCount) {
        //         //     break outer;
        //         // }
        //     }
        // }}
        
        if (this.showBlocksCount < result.length) {
            result.sort((b1, b2) => b1.relativePosition.distanceTo(rpc) - b2.relativePosition.distanceTo(rpc));
            result.length = this.showBlocksCount;
        }

        if (this.maxStoredBlocksCount < this.storedBlocks.size) {
            const maxDistance = Math.pow(this.maxStoredBlocksCount, 1 / 3);
            let delCnt = Math.trunc(0.2 * this.maxStoredBlocksCount);

            for (const [key, block] of this.storedBlocks.entries()) {
                if (maxDistance < rpc.distanceTo(block.relativePosition)) {
                    this.storedBlocks.delete(key);
                    if (--delCnt === 0) {
                        break;
                    }
                }
            }
        }

        // console.log(result);

        // const ra = this.getReverseAngles();

        return result.map(block => new Block({
            geometry: new DrawableCube({
                center: this.geometry.getAbsolutePoint(block.relativePosition),
                color: block.color.clone(),
                radius: 0.5,
                rotation: this.geometry.rotation,
            }),
            parent: this,
            info: block,
        }));
    }
}



        // const rcount = 7;
        // outer: for (let r = 0; r < rcount; ++r) {
        //     const side = r * 2 + 1;
        //     const prevSide = (Math.max(0, side - 2)) ** 2;
        //     const cnt = (side ** 3) - (prevSide ** 3);
        //     const midLvlCnt = (side - 1) * 4;
        //     const square = side * side;

        //     for (let ind = 0; ind < cnt; ++ind) {
        //         const cur = rpc.clone(); // .plusN(rcount / 2, rcount / 2, rcount / 2);

        //         if (ind < square) {
        //             // Bottom square
        //             // console.log('Bottom square', new Vector3(ind % side, -r, (ind / side) >> 0));
        //             cur.plusN((ind % side), 0, ((ind / side) >> 0));
        //         } else
        //         if (cnt - square < ind) {
        //             // Top square
        //             // console.log('Top square', new Vector3(ind % side, r, (ind / side) >> 0));
        //             cur.plusN((ind % side), r, ((ind / side) >> 0));
        //         } else {
        //             continue;
        //             // Sides
        //             const ri = ind - square;
        //             const ry = (ri / midLvlCnt) >> 0;
        //             const rxzi = ri % midLvlCnt;
        //             let rx: number;
        //             let rz: number;

        //             const state = (rxzi / side) >> 0;

        //             switch (state) {
        //                 case 0: rx = rxzi % side; rz = 0; break;
        //                 case 1: rx = side; rz = rxzi % side; break;
        //                 case 2: rx = rxzi % side; rz = -side; break;
        //                 case 3: rx = -side; rz = rxzi % side; break;
        //             }

        //             cur.plusN(-r + rx, -r + 1 + ry, -r + rz);
        //             // console.log('Side', new Vector3(-r + rx, -r + 1 + ry, -r + rz));
        //         }

<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { GKM } from "../../libs/gui/gkm";
    import { Gl2Utils } from "../../helpers/webgl/Gl2Utils";
    import { Vector2 } from "../../libs/math/Vector2";
    import { Vector3 } from "../../libs/math/Vector3";
    import { Helpers } from "../../helpers/common";
    import Fps from "../../projects/raytracing/components/Fps.svelte";
    import { DrawableSphere } from "../../libs/drawableGeometry/DrawableSphere";
    import { Camera3 } from "../../libs/render/Camera3";
    import { RigidBody3 } from "../../libs/physics/RigidBody3";
    import { PhysicsEngine3 } from "../../libs/physics/PhysicsEngine3";
    import { Info } from "../../projects/raytracing/components/Info";
    import { Body3 } from "../../libs/physics/Body3";
    import { Texture } from "../../libs/render/Texture";
    import type { IDrawableGeometry } from "../../libs/drawableGeometry/DrawableGeometry";
    import { ExposureCalculator } from "../../libs/render/ExposureCalculator";
    import { RaytracingProgram } from "../../projects/raytracing/shaders/raytracing";
    import * as TEXTURES from "../../projects/raytracing/textures/index";
    import { CONSTANTS } from "../../projects/raytracing/configs/constants";
    import { DrawableCube } from "../../libs/drawableGeometry/DrawableCube";
    import { Renderer3dContext2d } from "../../libs/render/renderers/3d/Context2d";
    import { DrawableSegment3 } from "../../libs/drawableGeometry/DrawableSegment3";
  import { Matrix3x3 } from "../../libs/math/Matrix3x3";
  import { Range } from "../../libs/math/Range";
  import { Rotation3 } from "../../libs/math/rotattion/Rotation3";

    const NUF = new Helpers.NumberUnitFormatter([
        { name: 'm', value: CONSTANTS.DISTANCE.M, countToNext: CONSTANTS.DISTANCE.KM / CONSTANTS.DISTANCE.M },
        { name: 'km', value: CONSTANTS.DISTANCE.KM, countToNext: 0.5 * CONSTANTS.DISTANCE.AU / CONSTANTS.DISTANCE.KM },
        { name: 'au', value: CONSTANTS.DISTANCE.AU, countToNext: CONSTANTS.DISTANCE.LY / CONSTANTS.DISTANCE.AU },
        { name: 'ly', value: CONSTANTS.DISTANCE.LY },
    ], {
        decimals: 2,
    });

    const ENGINE = new PhysicsEngine3<'planets' | 'blocks'>({
        mapRadius: 1000,
        mapCellSize: 50,
    });

    const CAMERA_OBJ = {
        camera: new Camera3({
            // origin: new Vector3(),
            angles: new Vector3(),
            d: 0.5,
            distance: 1e15,
        }),
        body: new RigidBody3({
            geometry: new DrawableSphere/* DrawableCube */({
                center: new Vector3(0, 0, 0),
                radius: 1,
                color: new Vector3(0.5, 0.5, 0.5),
                texture: Texture.create(TEXTURES.mars),
            }),
        }),
    };

    const LIGHT = new Body3({
        geometry: new DrawableSphere({
            center: new Vector3(0, 100, 0),
            radius: 10,
            color: new Vector3(1,1,1).multiplyN(1000),
            texture: Texture.create(TEXTURES.moon),
        }),
    });
    const GROUND = new Body3({
        // geometry: new DrawableCube({
        //     center: new Vector3(0, -5001, 0),
        //     radius: 5000,
        //     color: new Vector3(0.5, 0.5, 0.5),
        // }),
        geometry: new DrawableSphere({
            center: new Vector3(0, 0, 0),
            radius: 80,
            color: new Vector3(0.5, 0.5, 0.5),
            texture: Texture.create(TEXTURES.earth),
        }),
    });

    GROUND.geometry.rotation.setNXYZ(-Math.PI / 3, Math.PI, 0);

    let onFrame: () => number;
    let canvas3d: HTMLCanvasElement;
    let canvas2d: HTMLCanvasElement;
    const state = {
        isDestroyed: false,
        isPause: true,
        isMenu: false,
        showDebug: true,
        ut: <Gl2Utils> null,
        r32d: <Renderer3dContext2d> null,
        program: <RaytracingProgram> null,
        info: <Info> null,
        resolution: new Vector3(1, 1, 0.5),
        camera: CAMERA_OBJ.camera,
        CAMERA_OBJ,
        LIGHT,
        GROUND,
        ENGINE,
        gravity: 10,
        acceleration: 3, // Infinity, // 1e6,
        accelerationBoost: 10,
        time: 0,
        timeMultiplier: 1,
        autoExposure: new ExposureCalculator({ range: new Range(1, 5), enabled: true }),
        hovered: {
            object: <Body3> null,
            distance: Infinity,
        },
    };

    state.camera.ambient = 1;
    state.camera.exposure = 4;
    // state.autoExposure.enabled = false;

    function reset() {
        state.camera.origin.setN(0, 0, 0);
        // state.camera.angles.setN(0, 0, 0);
        state.camera.rotation.reset();
        state.camera.d = 0.4;

        CAMERA_OBJ.body.geometry.center.setN(0, 0, 0);
        CAMERA_OBJ.body.velocity.setN(0, 0, 0);
        CAMERA_OBJ.body.angleVelocity.setN(0, 0, 0);
        // CAMERA_OBJ.camera.angles.z = 0;

        ENGINE.clear();

        CAMERA_OBJ.body.geometry.center.setN(0, 0, 0);

        ENGINE.addBodies([
            state.LIGHT,
            state.GROUND,
            CAMERA_OBJ.body,
        ]);
    }

    const gkm = new GKM<
        'moveFront' | 'moveBack' | 'moveLeft' | 'moveRight' |
        'moveUp' | 'moveDown' |
        'moveFast' | 'moveStop' |
        'zoomIn' | 'zoomOut' |
        'pause' | 'menu' | 'reset' |
        'viewZ+' | 'viewZ-' |
        'fire' | 'aim',
        'viewX' | 'viewY' | 'zoom'
    >({
        keysBindings: {
            KeyW: 'moveFront', GAMEPAD_TRIGGER_RIGHT: 'moveFront',
            KeyS: 'moveBack', GAMEPAD_TRIGGER_LEFT: 'moveBack',
            KeyA: 'moveLeft',
            KeyD: 'moveRight',
            ShiftLeft: 'moveDown',
            Space: 'moveUp',
            KeyX: 'moveFast', GAMEPAD_A: 'moveFast',
            ArrowUp: 'zoomIn', GAMEPAD_UP: 'zoomIn',
            ArrowDown: 'zoomOut', GAMEPAD_DOWN: 'zoomOut',
            ArrowLeft: 'viewZ-',
            ArrowRight: 'viewZ+',
            Escape: 'menu',
            KeyP: 'pause', GAMEPAD_GUIDE: 'pause',
            KeyR: 'reset', GAMEPAD_START: 'reset',
            KeyQ: 'moveStop',
            MOUSE_LEFT: 'fire', MOUSE_RIGHT: 'aim',
        },
        axesBindings: {
            MOUSE_MOVEMENT_X: 'viewX',
            MOUSE_MOVEMENT_Y: 'viewY',
            GAMEPAD_STICK_LEFT_X: 'viewX',
            GAMEPAD_STICK_LEFT_Y: 'viewY',
            MOUSE_WHEEL_Y: 'zoom',
        },
    });

    function zoom(value: number) {
        if (!value) return;

        const c = 1.15;
        state.camera.d *= value > 0 ? c : (1 / c);
    }

    function isInputElementActive() {
        const activeTag = document.activeElement?.tagName;

        return activeTag === 'INPUT' || activeTag === 'SELECT' ||
            activeTag === 'OPTION' || activeTag === 'TEXTAREA';
    }

    gkm.addListener('axismove', (axis, value, src) => {
        if (document.pointerLockElement === canvas2d) {
            const rot = value / 1000 / state.camera.d;

            if (axis === 'viewX') {
                state.camera.rotation.rotateRelativeY(-rot);
            }
            
            if (axis === 'viewY') {
                state.camera.rotation.rotateRelativeX(-rot);
            }

            if (axis === 'zoom') {
                zoom(-value);
            }
        }
    });

    gkm.addListener('keydown', (key, value) => {
        if (key === 'menu') {
            // state.timeMultiplier = Number(!!state.timeMultiplier);
            // state.isMenu = !state.isMenu;
            state.isPause = !state.isPause;
        } else
        if (key === 'pause') {
            state.timeMultiplier = Math.fround(Math.abs(state.timeMultiplier - 0.99));
        } else
        if (key === 'reset') {
            reset();
        } else
        if (key === 'fire') {
            if (state.hovered.object instanceof RigidBody3) {
                ENGINE.removeBody(state.hovered.object);
            }
        } else
        if (key === 'aim') {
            tryAddRandomRigid();
        }
    });


    const _textures = Object.values({...TEXTURES, space: null}).filter(t => t);
    function tryAddRandomRigid() {
        if (!state.hovered.object) {
            return;
        }

        const cr = state.camera.getCenterRay();
        const p = cr.getPointByDistance(state.hovered.distance);
        const normal = state.hovered.object.geometry.getNormalToPoint(p);
        const center = p.plus(normal);

        let geometry: IDrawableGeometry;

        const texture = Texture.create(Helpers.randElement(_textures))
        if (Math.random() > 0.5) {
            geometry = new DrawableSphere({
                center,
                radius: 1,
                color: new Vector3(0.5, 0.5, 0.5),
                texture,
            });
        } else {
            geometry = new DrawableCube({
                center,
                // radius: 1,
                sizes: Vector3.createRandom(0.3, 4),
                color: new Vector3(0.5, 0.5, 0.5),
                texture,
            });
        }

        ENGINE.addBody(new RigidBody3({
            geometry,
        }));
    }

    function checkResolution() {
        const sz = state.resolution;

        sz.setN(window.innerWidth * sz.z, window.innerHeight * sz.z);

        if (sz.isEqualsN(canvas3d.width, canvas3d.height)) {
            return;
        }
        
        canvas3d.width = canvas2d.width = sz.x;
        canvas3d.height = canvas2d.height = sz.y;

        state.ut.gl.viewport(0, 0, sz.x, sz.y);

        state.camera.sizes.setN(sz.x, sz.y);
    }

    function checkKeys() {
        if (isInputElementActive()) {
            return;
        }

        if (gkm.getKeyValue('moveStop')) {
            CAMERA_OBJ.body.velocity.setN(0, 0, 0);
            CAMERA_OBJ.body.angleVelocity.setN(0, 0, 0);
        }

        zoom(+gkm.getKeyValue('zoomIn'));
        zoom(-gkm.getKeyValue('zoomOut'));

        state.camera.rotation.rotateRelativeZ(0.05 * (gkm.getKeyValue('viewZ+') - gkm.getKeyValue('viewZ-')));

        const maxAcceleration = state.acceleration * (gkm.isKeyPressed('moveFast') ? state.accelerationBoost : 1);

        const acceleration = new Vector3();

        acceleration
            .plus(state.camera.rotation.forwardDirection().multiplyN(
                gkm.getKeyValue('moveFront') - gkm.getKeyValue('moveBack')
            ))
            .plus(state.camera.rotation.rightDirection().multiplyN(
                gkm.getKeyValue('moveRight') - gkm.getKeyValue('moveLeft')
            ))
            .plus(state.camera.rotation.topDirection().multiplyN(
                gkm.getKeyValue('moveUp') - gkm.getKeyValue('moveDown')
            ));

        acceleration.normalize(maxAcceleration * Math.min(
            1,
            acceleration.length(),
        ));

        CAMERA_OBJ.body.acceleration.set(acceleration.multiplyN(1 / state.timeMultiplier ** 2));
    }

    function draw() {
        if (state.isDestroyed) {
            return;
        }

        requestAnimationFrame(draw);

        if (state.isPause) {
            return;
        }

        checkResolution();
        checkKeys();

        const dt = onFrame() / 1000 * state.timeMultiplier;
        state.time += dt;

        state.GROUND.geometry.center.y = -state.GROUND.geometry.radius - 1;

        ENGINE.calcStep(dt, {
            gravitation: {
                center: state.GROUND.geometry.center,
                acceleration: state.gravity,
            },
        });

        // camera position
        // {
        //     const player = state.CAMERA_OBJ.body;

        //     const toGround = state.GROUND.geometry.center.clone().minus(player.geometry.center);
        //     const toGroundDistance = toGround.length();
        //     toGround.normalize();
        //     const velocity = player.velocity.clone();
        //     const cameraDir = state.camera.getDirection();

        //     state.camera.origin.set(CAMERA_OBJ.body.geometry.center).minus(
        //         new Vector3(0, -1, 1)
        //         /* toGround */.multiplyN(5 * player.geometry.radius),
        //     );
        // }
        state.camera.origin.set(CAMERA_OBJ.body.geometry.center).minus(
            state.camera.getDirection()
                .multiplyN(state.CAMERA_OBJ.body.geometry.radius * 10)
                .plus(
                    CAMERA_OBJ.body.geometry.center.getDirectionTo(state.GROUND.geometry.center)
                        .multiplyN(4 * state.CAMERA_OBJ.body.geometry.radius),
                ),
        );

        state.hovered = ENGINE.rigidMapper.tryGetFirstRayIntersected(
            state.camera.getCenterRay(),
            CAMERA_OBJ.body,
        );
        if (!state.hovered.object) {
            state.hovered = ENGINE.staticMapper.tryGetFirstRayIntersected(
                state.camera.getCenterRay(),
            );
        }

        const rigids = ENGINE.rigidMapper.getAll();
        const statics = ENGINE.staticMapper.getAll();

        let info = `Aim (distance:${NUF.format(state.hovered.distance - CAMERA_OBJ.body.geometry.radius)}`;
        if (state.hovered.object) {
            info += `; type:${state.hovered.object['constructor'].name}`;
        }
        info += `); Rigids:${rigids.length}`;
        
        state.camera.exposure = state.autoExposure.calc(state.camera.exposure, state.ut);

        const visibleRigidsGeometry = rigids.map(o => <IDrawableGeometry> o.geometry)
            .filter(g => state.camera.isGeometryVisible(g));
        
        state.program.draw({
            camera: state.camera,
            lights: [<IDrawableGeometry> LIGHT.geometry],
            objects: [
                ...visibleRigidsGeometry,
                ...statics.map(o => <IDrawableGeometry> o.geometry),
            ],
        });

        state.r32d.clear();
        if (state.showDebug) {
            // state.r32d.drawObjects([<any> state.LIGHT.geometry], state.camera);
            state.r32d.drawObjects(ENGINE.rigidStaticCollisions.map(c => {
                return [
                    // new DrawableSphere({ center: c.point, radius: 1, color: new Vector3(1,0,0) }),
                    new DrawableSegment3({ p0: c.point, p1: c.impulse.plus(c.point), color: new Vector3(1,0.5,0) }),
                    new DrawableSegment3({ p0: c.point, p1: c.normal.plus(c.point), color: new Vector3(1,1,1) }),
                ];
            }).flat(), state.camera);
            state.r32d.drawObjects(visibleRigidsGeometry.map(g => {
                const r = 1;
                // const p0 = new Vector3(0, g.radius, 0).rotateXYZ(g.angles).plus(g.center);
                // const ax = new Vector3(r, 0, 0).rotateXYZ(g.angles).plus(p0);
                // const ay = new Vector3(0, r, 0).rotateXYZ(g.angles).plus(p0);
                // const az = new Vector3(0, 0, r).rotateXYZ(g.angles).plus(p0);
                const p0 = g.rotation.getRelativeVector(new Vector3(0, g.radius, 0)).plus(g.center);
                const ax = g.rotation.getRelativeVector(new Vector3(r, 0, 0)).plus(p0);
                const ay = g.rotation.getRelativeVector(new Vector3(0, r, 0)).plus(p0);
                const az = g.rotation.getRelativeVector(new Vector3(0, 0, r)).plus(p0);
                return [
                    new DrawableSegment3({ p0, p1: ax, color: new Vector3(1,0,0) }),
                    new DrawableSegment3({ p0, p1: ay, color: new Vector3(0,1,0) }),
                    new DrawableSegment3({ p0, p1: az, color: new Vector3(0,0,1) }),
                ];
            }).flat(), state.camera);
            state.r32d.drawAxes(state.camera);
        }

        const pp = state.CAMERA_OBJ.body.geometry.center;
        info += `\nPP(${pp.x.toFixed(4)},${pp.y.toFixed(4)},${pp.z.toFixed(4)})`;

        state.info.show(info);
    };

    onMount(() => {
        try {
        console.log('Mount start', state.ut);
        state.info = new Info();
        state.r32d = new Renderer3dContext2d(canvas2d.getContext('2d'));

        // state.info.show('WebGL initializing', true);
        state.ut = new Gl2Utils(<any> canvas3d.getContext('webgl2', {
            saveDrawingBuffer: true,
            preserveDrawingBuffer: true,
        }));

        // state.info.show('Shaders compiling', true);
        
        state.program = new RaytracingProgram(state.ut, { skyboxSource: TEXTURES.space });

        gkm.init(document.body);

        globalThis['state'] = state;
        globalThis['gkm'] = gkm;

        // state.info.show('Starting');
        console.log('Mount end');
        
        reset();
        console.log('Start drawing');
        draw();
        } catch (error) {
            alert('' + error + error.stack);
        }
    });

    onDestroy(() => {
        console.log('Destroy start', state.ut);
        state.isDestroyed = true;
        state.ut.destroy();
        state.info.destroy();
        gkm.destroy();
        console.log('Destroy end');
    });
</script>

<svelte:options ></svelte:options>

<canvas bind:this={canvas3d}></canvas>

<canvas
    bind:this={canvas2d}
    on:click={e => {
        canvas2d.requestPointerLock();
    }}
    on:touchmove={e => {
        e.preventDefault();

        if (e['scale']) {
            zoom(e['scale'] - 1);
        }
    }}
></canvas>

{#if !state.showDebug}
    <div id='cursor'></div>
{/if}

<Fps
    bind:onFrame={onFrame} bind:isPause={state.isPause}
></Fps>

<style>
    canvas {
        position: fixed;
        left: 0px;
        top: 0px;
        width: 100vw;
        height: 100vh;
        /* background: black; */
    }

    #cursor {
        position: fixed;
        left: 50vw;
        top: 50vh;
        width: 0px;
        height: 0px;
    }
    #cursor::before {
        content: ' ';
        display: block;
        margin-left: -10px;
        margin-top: -2px;
        width: 20px;
        height: 4px;
        backdrop-filter: invert(100%);
    }
    #cursor::after {
        content: ' ';
        display: block;
        margin-left: -2px;
        margin-top: -12px;
        width: 4px;
        height: 20px;
        /* background: white; */
        backdrop-filter: invert(100%);
    }
</style>

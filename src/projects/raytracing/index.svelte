<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { writable } from 'svelte/store';
    import { GKM } from "../../libs/gui/gkm";
    import { Gl2Utils } from "../../helpers/webgl/Gl2Utils";
    import { Vector2 } from "../../libs/math/Vector2";
    import { Vector3 } from "../../libs/math/Vector3";
    import * as SHADERS from "./shaders/index";
    import * as TEXTURES from "./textures";
    import { Matrix } from "../../libs/math/Matrix";
    import { Matrix3x3 } from "../../libs/math/Matrix3x3";
    import { Helpers } from "../../helpers/common";
    import Menu from "./components/Menu.svelte";
    import Fps from "./components/Fps.svelte";
    import { DrawableSphere } from "../../libs/drawableGeometry/DrawableSphere";
    import { Camera3 } from "../../libs/render/Camera3";
    import { OBJECTS } from "./configs/objects";
    import { RigidBody3 } from "../../libs/physics/RigidBody3";
    import { PhysicsEngine3 } from "../../libs/physics/PhysicsEngine3";
    import { CONSTANTS } from "./configs/constants";
    import { Info } from "./components/Info";
    import { Block, Planet } from "./physics/Planet";
    import type { Body3 } from "../../libs/physics/Body3";
    import { Texture } from "../../libs/render/Texture";
    import type { IDrawableGeometry } from "../../libs/drawableGeometry/DrawableGeometry";
    import { ExposureCalculator } from "../../libs/render/ExposureCalculator";
  import { RaytracingProgram } from "./shaders/raytracing";
//   import HoveredElement from "./components/HoveredElement.svelte";

    const NUF = new Helpers.NumberUnitFormatter([
        { name: 'm', value: CONSTANTS.DISTANCE.M, countToNext: CONSTANTS.DISTANCE.KM / CONSTANTS.DISTANCE.M },
        { name: 'km', value: CONSTANTS.DISTANCE.KM, countToNext: 0.5 * CONSTANTS.DISTANCE.AU / CONSTANTS.DISTANCE.KM },
        { name: 'au', value: CONSTANTS.DISTANCE.AU, countToNext: CONSTANTS.DISTANCE.LY / CONSTANTS.DISTANCE.AU },
        { name: 'ly', value: CONSTANTS.DISTANCE.LY },
    ], {
        decimals: 2,
    });

    const ENGINE = new PhysicsEngine3<'stars' | 'planets' | 'blocks', TEXTURES.TextureName>({
        mapRadius: 1e10,
        mapCellSize: 3e9,
    });

    const CAMERA_OBJ = Camera3.createWithBody({
        origin: new Vector3(0, 0, -10000),
        angles: new Vector3(),
        d: 0.5,
        distance: 1e15,
    });

    ENGINE.addBody(CAMERA_OBJ.body);

    let onFrame: () => number;
    let canvas: HTMLCanvasElement;
    const state = {
        isDestroyed: false,
        isPause: false,
        isMenu: false,
        ut: <Gl2Utils> null,
        program: <RaytracingProgram> null,
        info: new Info(),
        resolution: new Vector3(1, 1, 0.5),
        camera: CAMERA_OBJ.camera,
        CAMERA_OBJ,
        OBJECTS,
        ENGINE,
        objects: <RigidBody3[]>[],
        lights: <RigidBody3[]>[],
        acceleration: 1, // Infinity, // 1e6,
        accelerationBoost: 10,
        time: 0,
        timeMultiplier: 1,
        autoExposure: new ExposureCalculator(),
        selectedStars:
            <Record<TEXTURES.TextureName, boolean>>
            Object.fromEntries(Object.keys(OBJECTS.stars).map(n => [n, true])),
        selectedPlanets:
            <Record<TEXTURES.TextureName, boolean>>
            Object.fromEntries(Object.keys(OBJECTS.planets).map(n => [n, true])),
        lockViewOn: <TEXTURES.TextureName> null,
        showDistanceTo: <TEXTURES.TextureName> null,
        hovered: {
            object: <Body3> null,
            distance: Infinity,
        },
    };

    function reset() {
        state.camera.origin.setN(0, 0, 1000000000);
        // state.camera.angles.setN(0, 0, 0);
        state.camera.rotation.reset();
        state.camera.d = 0.4;

        CAMERA_OBJ.body.velocity.setN(0, 0, 0);
        CAMERA_OBJ.body.angleVelocity.setN(0, 0, 0);

        state.lights.length = 0;
        state.objects.length = 0;
    }

    function beSatelliteOf(options: {
        centerName: TEXTURES.TextureName;
        distance: number;
        k: number;
    }) {
        const centerBody = ENGINE.getBodyByName(options.centerName);

        (centerBody instanceof Planet) && ENGINE.makeSatellite({
            centerBody,
            satelliteBody: CAMERA_OBJ.body,
            distance: options.distance,
            k: options.k,
        });
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
        // console.log(axis);

        if (document.pointerLockElement === canvas) {
            const rot = value / 1000 / state.camera.d;

            if (axis === 'viewX') {
                // const v = new Vector2(0, -rot).rotate(state.camera.angles.z);
                // state.camera.angles.y += v.y * state.camera.getInversionMultiplier();
                // state.camera.angles.x += v.x;
                state.camera.rotation.rotateRelativeY(-rot);
            }
            
            if (axis === 'viewY') {
                // const v = new Vector2(rot, 0).rotate(state.camera.angles.z);
                // state.camera.angles.x += v.x;
                // state.camera.angles.y += v.y * state.camera.getInversionMultiplier();
                state.camera.rotation.rotateRelativeX(-rot);
            }

            if (axis === 'zoom') {
                zoom(-value);
            }
        }
    });

    gkm.addListener('keydown', (key, value) => {
        if (key === 'menu') {
            state.isMenu = !state.isMenu;
        } else
        if (key === 'pause') {
            state.isPause = !state.isPause;
        } else
        if (key === 'reset') {
            reset();
        } else
        if (key === 'fire') {
            const { object } = ENGINE.staticMapper.tryGetFirstRayIntersected(
                state.camera.getCenterRay(),
            );

            if (object instanceof Block) {
                object.remove();
            }
        } else
        if (key === 'aim') {
            const ray = state.camera.getCenterRay();
            const { object, distance } = ENGINE.staticMapper.tryGetFirstRayIntersected(ray);

            if (object instanceof Block) {
                object.addBlockOnFace(
                    object.geometry.getNormalToPoint(ray.getPointByDistance(distance)),
                );
            }
        }
    });

    function checkResolution() {
        const sz = state.resolution;

        sz.setN(window.innerWidth * sz.z, window.innerHeight * sz.z);

        if (sz.isEqualsN(canvas.width, canvas.height)) {
            return;
        }
        
        canvas.width = sz.x;
        canvas.height = sz.y;

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
            // CAMERA_OBJ.camera.angles.z = 0;
            // CAMERA_OBJ.camera.rotation.angle = 0;
        }

        zoom(+gkm.getKeyValue('zoomIn'));
        zoom(-gkm.getKeyValue('zoomOut'));

        // state.camera.angles.z += 0.05 * gkm.getKeyValue('viewZ+');
        // state.camera.angles.z -= 0.05 * gkm.getKeyValue('viewZ-');
        state.camera.rotation.rotateRelativeZ(0.05 * (gkm.getKeyValue('viewZ+') - gkm.getKeyValue('viewZ-')));

        const maxAcceleration = state.acceleration * (gkm.isKeyPressed('moveFast') ? state.accelerationBoost : 1);

        // const dir = state.camera.getDirection();

        const acceleration = new Vector3()
            // .plus(dir.clone().rotateY(Math.PI/2).multiplyN(gkm.getKeyValue('moveLeft')))
            // .plus(dir.clone().rotateY(-Math.PI/2).multiplyN(gkm.getKeyValue('moveRight')))
            // .plus(dir.clone().rotateX(Math.PI/2).multiplyN(gkm.getKeyValue('moveDown')))
            // .plus(dir.clone().rotateX(-Math.PI/2).multiplyN(gkm.getKeyValue('moveUp')))
            // .plus(dir.clone().multiplyN(gkm.getKeyValue('moveBack')))
            // .plus(dir.clone().multiplyN(-gkm.getKeyValue('moveFront')));

        // acceleration.x -= gkm.getKeyValue('moveLeft');
        // acceleration.x += gkm.getKeyValue('moveRight');
        // acceleration.y -= gkm.getKeyValue('moveDown');
        // acceleration.y += gkm.getKeyValue('moveUp');
        // acceleration.z -= gkm.getKeyValue('moveBack');
        // acceleration.z += gkm.getKeyValue('moveFront');

        // acceleration.rotateZXY(state.camera.angles);

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

        // const im = state.camera.getInversionMultiplier();
        // acceleration.x *= im;
        // acceleration.y *= im;

        acceleration.normalize(maxAcceleration * Math.min(
            1,
            acceleration.length(),
        ));

        CAMERA_OBJ.body.acceleration.set(acceleration.multiplyN(1 / state.timeMultiplier ** 2));
    }

    function checkGui() {
        for (const [key, enabled] of Object.entries(state.selectedStars)) {
            const star = <TEXTURES.TextureName> key;
            const exists = ENGINE.getBodyByGroupAndName('stars', star);
            if (!enabled && exists) {
                ENGINE.removeBodyByName(star);
            } else
            if (enabled && !exists) {
                const info = OBJECTS.stars[star];
                const body = info.body.clone();
                ENGINE.addBodyByNameAndGroup(body, star, 'stars');

                if (info.satelliteOf) {
                    const centerBody = ENGINE.getBodyByName(info.satelliteOf);
                    (centerBody instanceof RigidBody3) && ENGINE.makeSatellite({
                        centerBody,
                        satelliteBody: body,
                        distance: 1.0 * (info.orbitRadius - centerBody.geometry.radius - body.geometry.radius),
                    });
                }

                // TODO: remove
                state.ENGINE.G = 0;
                body.velocity.multiplyN(0);
                body.angleVelocity.multiplyN(0);
            }
        }

        for (const [key, enabled] of Object.entries(state.selectedPlanets)) {
            const planet = <TEXTURES.TextureName> key;
            const exists = ENGINE.getBodyByGroupAndName('planets', planet);
            if (!enabled && exists) {
                ENGINE.removeBodyByName(planet);
            } else
            if (enabled && !exists) {
                const info = OBJECTS.planets[planet];
                // console.log(planet, info);
                const body = info.body.clone();
                ENGINE.addBodyByNameAndGroup(body, planet, 'planets');

                if (info.satelliteOf) {
                    const centerBody = ENGINE.getBodyByName(info.satelliteOf);
                    const distance = 1.000001 * (info.orbitRadius - centerBody.geometry.radius - body.geometry.radius);
                    (centerBody instanceof RigidBody3) && ENGINE.makeSatellite({
                        centerBody,
                        satelliteBody: body,
                        distance, //: centerBody.geometry.radius + Helpers.rand(100000),
                    });
                }

                // TODO: remove
                state.ENGINE.G = 0;
                body.velocity.multiplyN(0);
                body.angleVelocity.multiplyN(0);
            }
        }
    }

    function draw() {
        if (state.isDestroyed) {
            return;
        }

        requestAnimationFrame(draw);

        if (state.isPause) {
            return;
        }

        checkGui();
        checkResolution();
        checkKeys();

        const dt = onFrame() / 1000 * state.timeMultiplier;
        state.time += dt;

        ENGINE.removeBodiesByGroup('blocks');

        const planet = ENGINE.rigidMapper.tryGetClosestTo(CAMERA_OBJ.body);

        if (planet instanceof Planet) {
            const blocks = planet.getPlayerNearBlocks(state.camera, CAMERA_OBJ.body);

            for (let i=0; i<blocks.length; ++i) {
                ENGINE.addBodyByNameAndGroup(blocks[i], <any> `block_${i}`, 'blocks');
            }
        }

        ENGINE.calcStep(dt);
        state.hovered = ENGINE.staticMapper.tryGetFirstRayIntersected(
            state.camera.getCenterRay(),
        );

        if (!state.hovered.object) {
            state.hovered = ENGINE.rigidMapper.tryGetFirstRayIntersected(
                state.camera.getCenterRay(),
                CAMERA_OBJ.body,
            );
        }

        if (state.hovered.object instanceof Block) {
            state.hovered.object.highlight();
        }

        const blocks = ENGINE.getBodiesByGroup('blocks');

        const stars = ENGINE.getBodiesByGroup('stars');
        const planets = ENGINE.getBodiesByGroup('planets');

        let info = `Aim (distance:${NUF.format(state.hovered.distance - CAMERA_OBJ.body.geometry.radius)}`;
        if (state.hovered.object) {
            info += `; type:${state.hovered.object['constructor'].name}`;
            if (state.hovered.object instanceof Planet) {
                info += `; name:${Helpers.capitalizeFirstLetter(state.hovered.object['name'])}`;
            }
        }
        info += `); Blocks:${blocks.length}`;

        if (ENGINE.getBodyByName(state.showDistanceTo)) {
            const body = ENGINE.getBodyByName(state.showDistanceTo);
            const distance = CAMERA_OBJ.body.geometry.getSignedDistanceTo(body.geometry);

            info += `;\nDistance to ${Helpers.capitalizeFirstLetter(state.showDistanceTo)} is ${NUF.format(distance)}`;
        }

        state.info.show(info);
        
        state.camera.exposure = state.autoExposure.calc(state.camera.exposure, state.ut);

        const visiblePlanetsGeometry = planets.map(o => <IDrawableGeometry> o.geometry)
            .filter(g => state.camera.isGeometryVisible(g));

        // console.log(planets.length, visiblePlanetsGeometry.length);
        
        state.program.draw({
            camera: state.camera,
            lights: stars.map(s => <IDrawableGeometry> s.geometry),
            objects: [
                ...visiblePlanetsGeometry,
                ...(blocks.map(o => <IDrawableGeometry> o.geometry)),
            ]
        });

        // ut.gl.useProgram(state.cursor.program);
        // ut.gl.drawArrays(ut.gl.TRIANGLE_FAN, 0, 6);

        if (ENGINE.getBodyByName(state.lockViewOn)) {
            const body = ENGINE.getBodyByName(state.lockViewOn);
            state.camera.lookAt(body.geometry.center);
        }
    };

    onMount(async () => {
        try {
        console.log('Mount start', state.ut);
        state.info.show('WebGL initializing', true);
        state.ut = new Gl2Utils(<any> canvas.getContext('webgl2', {
            saveDrawingBuffer: true,
            preserveDrawingBuffer: true,
        }));

        state.info.show('Shaders compiling', true);
        
        state.program = new RaytracingProgram(state.ut, { skyboxSource: TEXTURES.space });

        gkm.init(document.body);

        globalThis['state'] = state;
        globalThis['gkm'] = gkm;

        state.info.show('Loading textures', true);

        // const gen = state.ut.createLoadBindTextures(Texture.getAll(), {
        //     program: state.program.program,
        //     samplersNamePrefix: 'SAMPLER',
        //     // maxWidth: 512, maxHeight: 512,
        // });

        // for await (const texture of gen) {
        //     state.info.show(`Texture: ${texture.source.rawSource}`, true);
        // }

        reset();

        state.info.show('Starting');
        draw();
        console.log('Mount end');
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

    // $: !state.isPause && onFrame?.();
</script>

<svelte:options ></svelte:options>

<canvas
    bind:this={canvas}
    on:click={e => {
        canvas.requestPointerLock();
    }}
    on:touchmove={e => {
        e.preventDefault();

//         e.touches[0]['index'] ??= Date.now();

//         state.info.show(`Touches count: ${e.touches?.length.toString()}\n
// Touch[0] info: ${Object.keys(e.touches[0]['__proto__']).join(', ')}`;

        if (e['scale']) {
            zoom(e['scale'] - 1);
        }
    }}
></canvas>

<div id='cursor'></div>

<Fps
    bind:onFrame={onFrame} bind:isPause={state.isPause}
></Fps>

<Menu
    bind:show={state.isMenu}
    bind:pause={state.isPause}
    bind:resolution={state.resolution.z}
    bind:exposure={state.camera.exposure}
    bind:autoExposure={state.autoExposure}
    bind:fov={state.camera.d}
    bind:viewDistance={state.camera.distance}
    bind:acceleration={state.acceleration}
    bind:accelerationBoost={state.accelerationBoost}
    bind:timeMultiplier={state.timeMultiplier}
    bind:stars={state.selectedStars}
    bind:planets={state.selectedPlanets}
    bind:lockViewOn={state.lockViewOn}
    bind:showDistanceTo={state.showDistanceTo}
    beSatelliteOf={beSatelliteOf}
></Menu>

<!-- <HoveredElement bind:element={state.hoveredElement}></HoveredElement> -->

<style>
    canvas {
        background: black;
        width: 100vw;
        height: 100vh;
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

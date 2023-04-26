<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { writable } from 'svelte/store';
    import { GKM } from "../../libs/gui/gkm";
    import { Gl2Utils } from "../../helpers/webgl/Gl2Utils";
    import { Vector2 } from "../../libs/math/Vector2";
    import { Vector3 } from "../../libs/math/Vector3";
    import * as SHADERS from "./shaders";
    import * as TEXTURES from "./textures";
    import { Matrix } from "../../libs/math/Matrix";
    import { HelpersSvelte } from "../../helpers/svelte";
    import { Helpers } from "../../helpers/common";
    import Menu from "./components/Menu.svelte";
    import Fps from "./components/Fps.svelte";
    import { DrawableSphere, type DrawableSphereOptions } from "../../libs/drawableGeometry/DrawableSphere";
  import Info from "./components/Info.svelte";

    let onFrame: () => number;
    let canvas: HTMLCanvasElement;
    let ut: Gl2Utils<TEXTURES.TextureName>;
    const state = {
        isDestroyed: false,
        isPause: false,
        isMenu: false,
        infoText: '',
        program: <WebGLProgram> null,
        attributes: {
            positions: <number> null,
        },
        uniforms: {
            buffer: <WebGLBuffer> null,
            textures: <WebGLBuffer> null,
        },
        resolution: new Vector3(1, 1, 0.5),
        camera: {
            origin: new Vector3(0, 0, -100000),
            angles: new Vector3(),
            d: 1,
            viewDistance: 1e15,
        },
        objects: <DrawableSphere[]>[],
        lights: <DrawableSphere[]>[],
        objectsCount: 10,
        lightsCount: 2,
        acceleration: 1e6,
        accelerationBoost: 10,
        lightLoopPeriod: 5,
        lightLoopRadius: 25000,
        time: 0,
        timeMultiplier: 1,
    };

    function reset() {
        state.camera.origin.setN(0, 0, -100000);
        state.camera.angles.setN(0, 0, 0);
        state.camera.d = 1;

        state.lights[0] = new DrawableSphere({
            center: new Vector3(0, 0, 149_600_000_000),
            radius: 696_340_000,
            color: new Vector3(1, 1, 1).multiplyN(2e3),
            textureIndex: ut.getTextureIndex('sun'),
        });
    }

    const gkm = new GKM<
        'moveFront' | 'moveBack' | 'moveLeft' | 'moveRight' |
        'moveUp' | 'moveDown' |
        'moveFast' |
        'zoomIn' | 'zoomOut' |
        'pause' | 'menu' | 'reset' |
        'viewZ+' | 'viewZ-',
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

    gkm.addListener('axismove', (axis, value) => {
        // console.log(axis);

        if (document.pointerLockElement === canvas) {
            if (axis === 'viewX')
                state.camera.angles.y -= value / 1000 / state.camera.d;
            
            if (axis === 'viewY')
                state.camera.angles.x -= value / 1000 / state.camera.d;
        }

        if (axis === 'zoom') {
            zoom(-value);
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

        ut.gl.viewport(0, 0, sz.x, sz.y);
    }

    function checkKeys() {
        zoom(+gkm.getKeyValue('zoomIn'));
        zoom(-gkm.getKeyValue('zoomOut'));

        state.camera.angles.z += 0.05 * gkm.getKeyValue('viewZ+');
        state.camera.angles.z -= 0.05 * gkm.getKeyValue('viewZ-');

        const maxAcceleration = state.acceleration * (gkm.isKeyPressed('moveFast') ? state.accelerationBoost : 1);

        const tmp = new Vector3();

        tmp.x -= gkm.getKeyValue('moveLeft');
        tmp.x += gkm.getKeyValue('moveRight');
        tmp.y -= gkm.getKeyValue('moveDown');
        tmp.y += gkm.getKeyValue('moveUp');
        tmp.z -= gkm.getKeyValue('moveBack');
        tmp.z += gkm.getKeyValue('moveFront');

        const m = Matrix.createRotation3x3FromAnglesVector(state.camera.angles);

        const acceleration = m.multiplyVector3Column(tmp);

        acceleration.normalize(maxAcceleration * Math.min(
            1,
            acceleration.length(),
        ));

        return {
            acceleration,
        };
    }

    function checkGui() {
        if (state.objectsCount > state.objects.length) {
            const count = state.objectsCount - state.objects.length;
            for (let i=0; i<count; ++i) {
                state.objects.push(new DrawableSphere({
                    center: Vector3.createRandom(10000, -10000),
                    radius: Helpers.rand(2500, 3500),
                    color: Vector3.createRandom(1, 0.1),
                    textureIndex: ut.getRandomTextureIndex(1),
                }));
            }
        } else {
            state.objects.length = Math.max(0, state.objectsCount || 0);
        }

        if (state.lightsCount > state.lights.length) {
            const count = state.lightsCount - state.lights.length;
            for (let i=0; i<count; ++i) {
                state.lights.push(new DrawableSphere({
                    center: Vector3.createRandom(10000, -10000),
                    radius: Helpers.rand(2500, 3500),
                    color: Vector3.createRandom(20, 5),
                    textureIndex: ut.getRandomTextureIndex(1),
                }));
            }
        } else {
            state.lights.length = Math.max(0, state.lightsCount || 0);
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

        const dt = onFrame() / 1000 * state.timeMultiplier;
        state.time += dt;

        // state.infoText = dt.toString();

        const { acceleration } = checkKeys();

        state.camera.origin.plus(acceleration.multiplyN(/* dt * dt */ 0.016 * 0.016));

        const angleXZ = state.time * (2 * Math.PI) / state.lightLoopPeriod;
        const lightXZ = Vector2.fromAngle(
            angleXZ,
            state.lightLoopRadius,
        );

        state.lights[0]?.angles.setN(undefined, angleXZ);
        state.lights[1]?.center.setN(lightXZ.x, 0, lightXZ.y);
        state.lights[1]?.angles.setN(undefined, -angleXZ);

        const MO = 12;
        const BO = MO + 8;
        const SS = 12;

        const f32a = new Float32Array(BO + SS * 100);
        const i32a = new Int32Array(f32a.buffer);

        const rotationMatrix = Matrix.createRotation3x3FromAnglesVector(state.camera.angles);

        rotationMatrix.putToArray(f32a, 0);

        state.resolution.putToArray(f32a, MO + 0);

        f32a[MO + 2] = state.camera.d;
        f32a[MO + 3] = state.camera.viewDistance;
        i32a[MO + 4] = state.lights.length;
        i32a[MO + 5] = state.lights.length + state.objects.length;

        const bodies = [...state.lights, ...state.objects];

        for (let i=0; i<bodies.length; ++i) {
            const offset = BO + SS * i;
            bodies[i].putToArray(f32a, offset, state.camera.origin);
            i32a[offset + 7] = bodies[i].textureIndex;
        }
        
        ut.updateUniformBuffer(state.uniforms.buffer, f32a.buffer);

        ut.gl.drawArrays(ut.gl.TRIANGLE_STRIP, 0, 4);
    };

    onMount(async () => {
        try {
        state.infoText = 'WebGL initializing';
        ut = new Gl2Utils(canvas.getContext('webgl2'));

        state.infoText = 'Shaders compiling';
        const program = ut.createProgram({
            use: true,
            shaders: [
                ut.compileShader(SHADERS.vertex.source, ut.gl.VERTEX_SHADER),
                ut.compileShader(SHADERS.fragment.source, ut.gl.FRAGMENT_SHADER),
            ],
        });

        state.infoText = 'Getting memory links';

        state.program = program;
        state.attributes.positions = ut.getAttribLocation(program, 'position');
        state.uniforms.buffer = ut.getUniformBuffer(program, 'Info', new Float32Array(16));

        ut.bindBuffer(SHADERS.vertex.data);
        ut.gl.enableVertexAttribArray(state.attributes.positions);
        ut.gl.vertexAttribPointer(
            state.attributes.positions,
            2, // position is a vec2 (2 values per component)
            ut.gl.FLOAT, // each component is a float
            false, // don't normalize values
            2 * 4, // two 4 byte float components per vertex (32 bit float is 4 bytes)
            0 // how many bytes inside the buffer to start from
        );

        gkm.init(document.body);

        globalThis['state'] = state;
        globalThis['ut'] = ut;
        globalThis['gkm'] = gkm;

        ut.setFirstTextureIndex('space');

        const TEXPART: any = {
            space: TEXTURES.space,
            sun: TEXTURES.sun,
            earth: TEXTURES.earth,
        }

        state.infoText = 'Loading textures';

        await ut.createLoadBindTextures(TEXTURES, {
            program,
            samplersNamePrefix: 'SAMPLER',
            maxWidth: 512, maxHeight: 512,
        });

        reset();

        state.infoText = 'Starting';
        draw();
        } catch (error) {
            alert('' + error + error.stack);
        }
    });

    onDestroy(() => {
        state.isDestroyed = true;
        gkm.destroy();
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

//         state.infoText = `Touches count: ${e.touches?.length.toString()}\n
// Touch[0] info: ${Object.keys(e.touches[0]['__proto__']).join(', ')}`;

        if (e['scale']) {
            zoom(e['scale'] - 1);
        }
    }}
></canvas>
<Fps
    bind:onFrame={onFrame} bind:isPause={state.isPause}
    style='left: unset; right: 10px; bottom: 10px; top: unset;'
></Fps>

<Menu
    bind:show={state.isMenu}
    bind:pause={state.isPause}
    bind:resolution={state.resolution.z}
    bind:fov={state.camera.d}
    bind:viewDistance={state.camera.viewDistance}
    bind:acceleration={state.acceleration}
    bind:accelerationBoost={state.accelerationBoost}
    bind:timeMultiplier={state.timeMultiplier}
    bind:lightOrbitPeriod={state.lightLoopPeriod}
    bind:lightOrbitRadius={state.lightLoopRadius}
    bind:lightsCount={state.lightsCount}
    bind:objectsCount={state.objectsCount}
></Menu>

<Info text={state.infoText}></Info>

<style>
    canvas {
        background: black;
        width: 100vw;
        height: 100vh;
    }
</style>

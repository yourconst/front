<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { GKM } from "../../libs/gui/gkm";
    import { Gl2Utils } from "../../helpers/webgl/Gl2Utils";
    import { Vector2 } from "../../libs/math/Vector2";
    import { Vector3 } from "../../libs/math/Vector3";
    import { Sphere } from "../../libs/geometry/Sphere";
    import * as SHADERS from "./shaders";
    import { Matrix } from "../../libs/math/Matrix";

    let canvas: HTMLCanvasElement;
    let ut: Gl2Utils;
    let state: ReturnType<typeof getState>;

    const gkm = new GKM<
        'moveFront' | 'moveBack' | 'moveLeft' | 'moveRight' |
        'moveUp' | 'moveDown' |
        'moveFast',
        'viewX' | 'viewY'
    >({
        keysBindings: {
            KeyW: 'moveFront',
            KeyS: 'moveBack',
            KeyA: 'moveLeft',
            KeyD: 'moveRight',
            ShiftLeft: 'moveDown',
            Space: 'moveUp',
            KeyX: 'moveFast',
            // GAMEPAD_BUMPER_RIGHT: 'moveFront',
            GAMEPAD_TRIGGER_RIGHT: 'moveFront',
        },
        axesBindings: {
            MOUSE_MOVEMENT_X: 'viewX',
            MOUSE_MOVEMENT_Y: 'viewY',
            GAMEPAD_STICK_LEFT_X: 'viewX',
            GAMEPAD_STICK_LEFT_Y: 'viewY',
        },
    });

    gkm.addListener('axismove', (axis, value) => {
        // console.log(axis);

        if (document.pointerLockElement === canvas) {
            if (axis === 'viewX')
                state.camera.angles.y -= value / 1000 / state.camera.d;
            
            if (axis === 'viewY')
                state.camera.angles.x += value / 1000 / state.camera.d;
        }

        if (axis === 'MOUSE_WHEEL_Y') {
            const c = 1.15;
            state.camera.d *= value < 0 ? c : (1 / c);
        }
    });

    gkm.addListener('keydown', (key) => {
        if (key === 'CapsLock')
            state.isPause = !state.isPause;
    });

    function onWindowResize() {
        state.sizes.set(window.innerWidth, window.innerHeight);

        canvas.width = state.sizes.x;
        canvas.height = state.sizes.y;

        ut.gl.viewport(0, 0, state.sizes.x, state.sizes.y);
    }

    function checkKeys() {
        const maxAcceleration = gkm.isKeyPressed('moveFast') ? state.accelerationFast : state.acceleration;

        const tmp = new Vector3();

        tmp.x -= gkm.getKeyValue('moveLeft');
        tmp.x += gkm.getKeyValue('moveRight');
        tmp.y -= gkm.getKeyValue('moveDown');
        tmp.y += gkm.getKeyValue('moveUp');
        tmp.z -= gkm.getKeyValue('moveBack');
        tmp.z += gkm.getKeyValue('moveFront');

        // const m = Matrix.createRotation3x3FromAnglesVector(state.camera.angles);

        // console.log(m.cells);

        // const acceleration = m.multiplyVector3Column(tmp).multiplyN(maxAcceleration);

        const acceleration = tmp;
        
        acceleration.rotateByAngles(state.camera.angles.y, state.camera.angles.x);

        acceleration.normalize(maxAcceleration * Math.min(
            1,
            acceleration.length(),
        ));

        // console.log(acceleration);

        return {
            acceleration,
        };
    }

    let draw = () => {
        requestAnimationFrame(draw);

        if (state.isPause) {
            return;
        }

        const time = Date.now();
        const dt = Math.min(100, time - state.lastUpdateTime) / 1000 * state.timeMultiplier;
        state.time += dt;
        state.dtsArray.push(time - state.lastUpdateTime);
        state.lastUpdateTime = time;
        if (state.dtsArray.length > 30) {
            state.dtsArray.shift();
        }
        state.fps = (
            1000 / (state.dtsArray.reduce((acc, v) => acc + v, 0) / state.dtsArray.length)
        ).toFixed(2);

        const { acceleration } = checkKeys();

        state.camera.origin.plus(acceleration.multiplyN(dt * dt));

        const lightXZ = Vector2.fromAngle(
            state.time * (2 * Math.PI) / state.lightLoopPeriod,
            state.lightLoopRadius,
        );

        state.lights[0].center.setN(lightXZ.x, 0, lightXZ.y);
        state.lights[1].center.setN(0, lightXZ.y, lightXZ.x);
        state.lights[2].center.setN(lightXZ.x, lightXZ.y, -lightXZ.x);

        const f32a = new Float32Array(16 + 8 * 4 + 8 * 100);
        const i32a = new Int32Array(f32a.buffer);
    
        state.camera.origin.putToArray(f32a, 0);
        f32a[3] = 0;
        Vector2.fromAngle(state.camera.angles.y).putToArray(f32a, 4);
        Vector2.fromAngle(state.camera.angles.x).putToArray(f32a, 6);
        state.sizes.putToArray(f32a, 8);

        f32a[10] = state.camera.d;
        f32a[11] = state.camera.viewDistance;
        i32a[12] = state.lights.length;
        i32a[13] = state.lights.length + state.spheres.length;
        f32a[14] = 0;
        f32a[15] = 0;

        const bodies = [...state.lights, ...state.spheres];

        for (let i=0; i<bodies.length; ++i) {
            bodies[i].putToArray(f32a, 16 + 8 * i);
        }
        
        ut.updateUniformBuffer(state.ubgb, f32a.buffer);

        ut.gl.drawArrays(ut.gl.TRIANGLE_STRIP, 0, 4);
    };

    function getState(program: WebGLProgram) {
        const result = {
            isPause: false,
            program,
            attributes: {
                positions: ut.getAttribLocation(program, 'position'),
            },
            ubgb: ut.getUniformBuffer(new Float32Array(16), program, 'Info'),
            sizes: new Vector2(),
            camera: {
                origin: new Vector3(0, 0, -10000),
                angles: new Vector3(),
                d: 1,
                viewDistance: 9999999,
            },
            acceleration: 1 * 1e6,
            accelerationFast: 5 * 1e6,
            spheres: [
                new Sphere(new Vector3(3000.0, 0.0, 0.0), 1000.0, new Vector3(1.0, 0.0, 0.0)),
                new Sphere(new Vector3(2000.0, 0.0, 5000.0), 500.0, new Vector3(1.0, 1.0, 0.0)),
                new Sphere(new Vector3(0.0, 0.0, 5000.0), 1500.0, new Vector3(1.0, 1.0, 1.0)),
                // new Sphere(new Vector3(-2000.0, 0.0, 4000.0), 500.0, new Vector3(0.0, 0.0, 1.0)),
                // new Sphere(new Vector3(-3000.0, 0.0, 6000.0), 500.0, new Vector3(1.0, 1.0, 1.0)),
                // new Sphere(new Vector3(-4000.0, 0.0, 4000.0), 500.0, new Vector3(1.0, 1.0, 1.0)),
                // new Sphere(new Vector3(-5000.0, 0.0, 6000.0), 500.0, new Vector3(0.0, 1.0, 0.0)),
                // new Sphere(new Vector3(-6000.0, 0.0, 4000.0), 500.0, new Vector3(1.0, 1.0, 1.0)),
                // new Sphere(new Vector3(-7000.0, 0.0, 6000.0), 500.0, new Vector3(1.0, 1.0, 1.0)),
                // new Sphere(new Vector3(7000.0, 0.0, 5000.0), 500.0, new Vector3(1.0, 1.0, 1.0)),
            ],
            lights: [
                new Sphere(new Vector3(), 1000.0, new Vector3(1, 1, 1).multiplyN(3)),
                new Sphere(new Vector3(), 1000.0, new Vector3(1, 1, 1).multiplyN(3)),
                new Sphere(new Vector3(), 1000.0, new Vector3(1, 1, 1).multiplyN(3)),
            ],
            lightLoopPeriod: 2,
            lightLoopRadius: 15000,
            dtsArray: [],
            lastUpdateTime: Date.now(),
            time: 0,
            timeMultiplier: 1,
            fps: "0",
        };

        for (let i=0; i<35; ++i) {
            result.spheres.push(new Sphere(
                Vector3.createRandom(10000, -10000), 1000, Vector3.createRandom(1, 0.1),
            ));
        }

        return result;
    }

    onMount(() => {
        ut = new Gl2Utils(canvas.getContext('webgl2'));

        const program = ut.createProgram({
            use: true,
            shaders: [
                ut.compileShader(SHADERS.vertex.source, ut.gl.VERTEX_SHADER),
                ut.compileShader(SHADERS.fragment.source, ut.gl.FRAGMENT_SHADER),
            ],
        });

        state = getState(program);

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

        onWindowResize();

        draw();
    });

    onDestroy(() => {
        draw = () => {};
        gkm.destroy();
    });
</script>

<canvas
    bind:this={canvas}
    on:click={e => {
        canvas.requestPointerLock();
    }}
></canvas>
<div id='fpsMeter'>{state?.fps}</div>

<svelte:window
    on:resize={onWindowResize}
></svelte:window>

<style>
    #fpsMeter {
        display: block;
        color: white;
        font-size: 16px;
        font-family: 'Courier New', Courier, monospace;
        position: fixed;
        right: 10px;
        top: 10px;
    }
</style>

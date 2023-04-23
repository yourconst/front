<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Gl2Utils } from "./libs/Gl2Utils";
    import { Vector2 } from "./libs/Vector2";
    import * as SHADERS from "./shaders";
  import { Vector3 } from "./libs/Vector3";
  import { Sphere } from "./libs/Sphere";

    let canvas: HTMLCanvasElement;
    let ut: Gl2Utils;
    let state: ReturnType<typeof getState>;

    function onWindowResize() {
        state.sizes.set(window.innerWidth, window.innerHeight);

        canvas.width = state.sizes.x;
        canvas.height = state.sizes.y;

        ut.gl.viewport(0, 0, state.sizes.x, state.sizes.y);
    }

    let draw = () => {
        // console.log('draw');
        requestAnimationFrame(draw);

        const lightXZ = Vector2.fromAngle(
            performance.now() * (2 * Math.PI) / state.lightLoopPeriod,
            state.lightLoopRadius,
        );

        state.lights[0].center.x = lightXZ.x;
        state.lights[0].center.z = lightXZ.y;

        // const f32a = new Float32Array(2 + 3 + 2 + 1 + 1 + 1 + 7 * state.spheres.length);
        const f32a = new Float32Array(12 + 8 * 4 + 8 * 100);
        const i32a = new Int32Array(f32a.buffer);
        f32a[0] = state.camera.origin.x;
        f32a[1] = state.camera.origin.y;
        f32a[2] = state.camera.origin.z;
        f32a[3] = 0;
        const directionXZ = Vector2.fromAngle(state.camera.angleXZ);
        f32a[4] = directionXZ.x;
        f32a[5] = directionXZ.y;

        f32a[6] = state.sizes.x;
        f32a[7] = state.sizes.y;

        f32a[8] = state.camera.d;
        f32a[9] = state.camera.viewDistance;
        i32a[10] = state.lights.length;
        i32a[11] = state.spheres.length;

        for (let i=0; i<state.lights.length; ++i) {
            const s = state.lights[i];
            const o = 12 + 8 * i;

            f32a[o + 0] = s.center.x;
            f32a[o + 1] = s.center.y;
            f32a[o + 2] = s.center.z;

            f32a[o + 3] = s.radius;

            f32a[o + 4] = Math.pow(s.color.x, 1 /* / 2.2 */);
            f32a[o + 5] = Math.pow(s.color.y, 1 /* / 2.2 */);
            f32a[o + 6] = Math.pow(s.color.z, 1 /* / 2.2 */);
        }

        for (let i=0; i<state.spheres.length; ++i) {
            const s = state.spheres[i];
            const o = 12 + 8 * 4 + 8 * i;

            f32a[o + 0] = s.center.x;
            f32a[o + 1] = s.center.y;
            f32a[o + 2] = s.center.z;

            f32a[o + 3] = s.radius;

            f32a[o + 4] = Math.pow(s.color.x, 1 / 2.2);
            f32a[o + 5] = Math.pow(s.color.y, 1 / 2.2);
            f32a[o + 6] = Math.pow(s.color.z, 1 / 2.2);
        }

        // console.log(f32a);
        
        ut.updateUniformBuffer(state.ubgb, f32a.buffer);

        ut.gl.drawArrays(ut.gl.TRIANGLE_STRIP, 0, 4);

        const time = Date.now();
        state.dtsArray.push(time - state.lastUpdateTime);
        state.lastUpdateTime = time;
        if (state.dtsArray.length > 30) {
            state.dtsArray.shift();
        }
        state.fps = (
            1000 / (state.dtsArray.reduce((acc, v) => acc + v, 0) / state.dtsArray.length)
        ).toFixed(2);
    };

    function getState(program: WebGLProgram) {
        const result = {
            program,
            attributes: {
                positions: ut.getAttribLocation(program, 'position'),
            },
            ubgb: ut.getUniformBuffer(new Float32Array(16), program, 'Info'),
            // uniforms: {
            //     sizes: ut.getUniformLocation(program, 'sizes'),
            //     origin: ut.getUniformLocation(program, 'origin'),
            //     directionXZ: ut.getUniformLocation(program, 'directionXZ'),
            //     d: ut.getUniformLocation(program, 'd'),
            //     time: ut.getUniformLocation(program, 'time'),

            //     count: ut.getUniformLocation(program, 'count'),
            //     spheres: ut.getUniformLocation(program, 'spheres'),
            // },
            sizes: new Vector2(),
            camera: {
                origin: new Vector3(0, 0, -10000),
                angleXZ: 0,
                d: 1,
                viewDistance: 9999999,
            },
            spheres: [
                new Sphere(new Vector3(3000.0, 0.0, 0.0), 1000.0, new Vector3(1.0, 0.0, 0.0)),
                new Sphere(new Vector3(2000.0, 0.0, 5000.0), 500.0, new Vector3(1.0, 1.0, 0.0)),
                new Sphere(new Vector3(0.0, 0.0, 5000.0), 1500.0, new Vector3(1.0, 1.0, 1.0)),
                new Sphere(new Vector3(-2000.0, 0.0, 4000.0), 500.0, new Vector3(0.0, 0.0, 1.0)),
                new Sphere(new Vector3(-3000.0, 0.0, 6000.0), 500.0, new Vector3(1.0, 1.0, 1.0)),
                new Sphere(new Vector3(-4000.0, 0.0, 4000.0), 500.0, new Vector3(1.0, 1.0, 1.0)),
                new Sphere(new Vector3(-5000.0, 0.0, 6000.0), 500.0, new Vector3(0.0, 1.0, 0.0)),
                new Sphere(new Vector3(-6000.0, 0.0, 4000.0), 500.0, new Vector3(1.0, 1.0, 1.0)),
                new Sphere(new Vector3(-7000.0, 0.0, 6000.0), 500.0, new Vector3(1.0, 1.0, 1.0)),
                new Sphere(new Vector3(7000.0, 0.0, 5000.0), 500.0, new Vector3(1.0, 1.0, 1.0)),
            ],
            lights: [
                new Sphere(new Vector3(0.0, 0.0, 0.0), 1000.0, new Vector3(9.9, 9.9, 9.9)),
                // new Sphere(new Vector3(0.0, -20000.0, 5000.0), 1000.0, new Vector3(0.0, 9.9, 0.0)),
            ],
            lightLoopPeriod: 5000,
            lightLoopRadius: 50000,
            dtsArray: [],
            lastUpdateTime: Date.now(),
            fps: "0"
        };

        for (let i=0; i<85; ++i) {
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

        onWindowResize();

        draw();

        globalThis['state'] = state;
        globalThis['ut'] = ut;
    });

    onDestroy(() => {
        draw = () => {};
    });
</script>

<canvas
    bind:this={canvas}
    on:mousemove={(e) => {
        state.camera.angleXZ -= e.movementX / 1000;
        // console.log(state.camera.angleXZ, e.movementX);
    }}
    on:click={e => {
        canvas.requestPointerLock();
    }}
></canvas>
<div id='fpsMeter'>{state?.fps}</div>

<svelte:window
    on:resize={onWindowResize}
    on:wheel={(e) => {
        const c = 1.05;
        state.camera.d *= e.deltaY < 0 ? c : (1 / c);
        // console.log(state.camera.d);
    }}
    on:keydown={(e) => {
        const speed = 300;

        const dirXZ = Vector2.fromAngle(state.camera.angleXZ - Math.PI / 2).multiplyN(speed);


        if (e.code === 'Space') { state.camera.origin.y += speed; }
        if (e.code === 'ShiftLeft') { state.camera.origin.y -= speed; }
        if (e.code === 'KeyA') {
            const v = dirXZ.clone().rotateAngle(-Math.PI / 2);
            state.camera.origin.x += v.x;
            state.camera.origin.z += v.y;
        }
        if (e.code === 'KeyD'){
            const v = dirXZ.clone().rotateAngle(Math.PI / 2);
            state.camera.origin.x += v.x;
            state.camera.origin.z += v.y;
        }
        if (e.code === 'KeyS'){
            const v = dirXZ;
            state.camera.origin.x += v.x;
            state.camera.origin.z += v.y;
        }
        if (e.code === 'KeyW'){
            const v = dirXZ.clone().rotateAngle(Math.PI);
            state.camera.origin.x += v.x;
            state.camera.origin.z += v.y;
        }
    }}
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

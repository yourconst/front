<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Vector2 } from "../../libs/math/Vector2";
    import { SmoothNumber } from "../../libs/math/SmoothNumber";
    import CustomLawRange from "../../projects/raytracing/components/CustomLawRange.svelte";
    import * as customLaws from '../../projects/raytracing/components/customLaws';
    import * as CALC from "./calc";
    import { Helpers } from "../../helpers/common";

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let lastAnimationFrame: number;
    const state = {
        rc: new SmoothNumber(100),
        rb: new SmoothNumber(50),
        cnt: new SmoothNumber(7),
        speed: new SmoothNumber(0.001),
        lasttime: Date.now(),
        time: 0,
        draw,
        transition: new SmoothNumber(0.3),
        lineWidth: new SmoothNumber(1),
        resolution: <Vector2> null,
    };

    globalThis['state'] = state;

    onMount(() => {
        console.log('mount');
        ctx = canvas.getContext('2d');
        state.resolution = new Vector2.Shell(canvas, 'width', 'height');
        main();
    });

    onDestroy(() => {
        console.log('destroy');
        cancelAnimationFrame(lastAnimationFrame);
    });

    function main() {
        lastAnimationFrame = requestAnimationFrame(main);
        state.rc.transition = state.rb.transition = state.cnt.transition =
            state.speed.transition = state.lineWidth.transition = state.transition.get() * 1000;
        const dt = (Date.now() - state.lasttime) * state.speed.get();
        state.lasttime = Date.now();
        state.time += dt;
        draw(state.rc.get(), state.rb.get(), state.cnt.get(), state.time);
        // draw(100, 110, 2);
    };

    // TODO: make 2d drawer
    function strokeCircle(o: {
        center: Vector2, radius: number, color?: string,
    }) {
        ctx.beginPath();
        ctx.strokeStyle = o.color || 'black';
        ctx.arc(o.center.x, o.center.y, o.radius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    function strokeLine(o: {
        p1: Vector2, p2: Vector2, color?: string,
    }) {
        ctx.beginPath();
        ctx.strokeStyle = o.color || 'black';
        ctx.moveTo(o.p1.x, o.p1.y);
        ctx.lineTo(o.p2.x, o.p2.y);
        ctx.stroke();
    }

    function clearCanvas() {
        state.resolution.set(Helpers.Screen.getWindowNativeResolution());
    }

    function draw(rc: number, rb: number, cnt: number, ap = Date.now() / state.speed.get()) {
        clearCanvas();

        ctx.lineWidth = state.lineWidth.get();

        const c = new Vector2(canvas.width, canvas.height).divideN(2);

        strokeCircle({ center: c, radius: rc, color: 'green' });

        const dab = 2 * Math.PI / cnt;
        // const ab = CALC.calcCirclesSectorAngle(rc, rb) / 2;
        // const rm = CALC.calcCircleSectorRadius(rc, (2 * Math.PI - ab * 2 * cnt) / cnt);
        const rm = CALC.calcSmallRadius(rc, rb, cnt);

        // const ll = rc + Math.max(rb, rm);

        for (let i=0; i<cnt; ++i) {
            const a = dab * i + ap;
            strokeCircle({ center: Vector2.fromAngle(a, rc + rb).plus(c), radius: rb });

            strokeCircle({
                center: Vector2.fromAngle(ap + (dab * (2 * i+1)) / 2, rc + rm).plus(c),
                radius: rm,
                color: 'red',
             });

            // strokeLine({ p1: c, p2: Vector2.fromAngle(a - ab, ll).plus(c) });
            // strokeLine({ p1: c, p2: Vector2.fromAngle(a + ab, ll).plus(c) });
        }
    }
</script>

<canvas bind:this={canvas}></canvas>

<table>
    <tr>
        <td>Count:</td>
        <td><CustomLawRange bind:value={state.cnt.target} min={2} max={20} step={1} law={customLaws.createPow(1.5)} /></td>
    </tr>
    <tr>
        <td>Center Radius:</td>
        <td><CustomLawRange bind:value={state.rc.target} min={10} max={200} step='any' law={customLaws.createPow(1.2)} /></td>
    </tr>
    <tr>
        <td>Other Radius:</td>
        <td><CustomLawRange bind:value={state.rb.target} min={10} max={200} step='any' law={customLaws.createPow(1.2)} /></td>
    </tr>
    <tr>
        <td>UI:</td>
    </tr>
    <tr>
        <td>Line Width:</td>
        <td><CustomLawRange bind:value={state.lineWidth.target} min={0.3} max={10} step='any' law={customLaws.createPow(1.7)} /></td>
    </tr>
    <tr>
        <td>Transition Duration:</td>
        <td><CustomLawRange bind:value={state.transition.target} min={0} max={10} step='any' law={customLaws.createPow(2)} /></td>
    </tr>
    <tr>
        <td>Rotation Speed:</td>
        <td><CustomLawRange bind:value={state.speed.target} min={-0.01} max={0.01} step='any' law={customLaws.linear} /></td>
    </tr>
</table>

<style>
    canvas {
        position: fixed;
        left: 0px;
        top: 0px;
        width: 100vw;
        height: 100vh;
        /* background: black; */
    }

    table {
        position: fixed;
        /* z-index: 10; */
    }
</style>

<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Vector2 } from "../../libs/math/Vector2";
    import { SmoothNumber } from "./SmoothNumber";
    import CustomLawRange from "../../projects/raytracing/components/CustomLawRange.svelte";
    import * as customLaws from '../../projects/raytracing/components/customLaws';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let lastAnimationFrame: number;
    const state = {
        rc: new SmoothNumber(100),
        rb: new SmoothNumber(150),
        cnt: new SmoothNumber(5),
        speed: new SmoothNumber(0.001),
        lasttime: Date.now(),
        time: 0,
        draw,
        transition: new SmoothNumber(0.3),
        lineWidth: new SmoothNumber(1),
    };

    globalThis['state'] = state;

    onMount(() => {
        console.log('mount');
        ctx = canvas.getContext('2d');
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
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function calcCirclesSectorAngle(rc, ro) {
        const d = Math.sqrt(rc * (2 * ro + rc));
        return 2 * Math.atan2(ro, d);
    }

    function calcCircleSectorRadius(rc, a) {
        const t2 = Math.tan(a / 2) ** 2;

        const x1 = rc * t2 * (1 + Math.sqrt(1 + 1 / t2));
        const x2 = rc * t2 * (1 - Math.sqrt(1 + 1 / t2));

        return x1 > 0 ? x1 : x2;
    }

    function calcSmallRadius(c: number, b: number, cnt: number) {
        // console.log(2);
        const a = 2 * Math.PI / cnt;
        const cos = Math.cos(a/2.9);
        return Math.abs((cos * (c + b) - b - c) / (1 - cos * (c + b) / c));
        return Math.sqrt((c**2) * ((Math.tan(a/4)**2) + 1) - c);
        const sin = Math.sin( a);
        const cos2 = cos**2;
        const sin2 = sin**2;

        const res = ((4 * (b**2) * (c**2) * (sin2))/((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2)) + (b * Math.sqrt((-4 * (b**2) * c * (sin2) - 4 * b * (c**2) * (sin2))**2 - 16 * (b**2) * (c**2) * (sin2) * ((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2))))/(2 * ((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2))) + (c * Math.sqrt((-4 * (b**2) * c * (sin2) - 4 * b * (c**2) * (sin2))**2 - 16 * (b**2) * (c**2) * (sin2) * ((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2))))/(2 * ((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2))) + (2 * b * c ** 3 * (sin2))/((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2)) + (2 * b^3 * c * (sin2))/((b**2) * -(cos2) + 2 * (b**2) * cos + 4 * b * c * (sin2) + 2 * b * c * cos2 - 4 * b * c * cos - (c**2) * cos2 + 2 * (c**2) * cos - (b**2) + 2 * b * c - (c**2)) - b * c - (c**2)) / (c - b);

        return Math.abs(res);
    }

    function draw(rc: number, rb: number, cnt: number, ap = Date.now() / state.speed.get()) {
        clearCanvas();

        ctx.lineWidth = state.lineWidth.get();

        const c = new Vector2(canvas.width, canvas.height).divideN(2);

        strokeCircle({ center: c, radius: rc, color: 'green' });

        const dab = 2 * Math.PI / cnt;
        // const ab = calcCirclesSectorAngle(rc, rb) / 2;
        // const rm = calcCircleSectorRadius(rc, (2 * Math.PI - ab * 2 * cnt) / cnt);
        const rm = calcSmallRadius(rc, rb, cnt);

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
        <td><CustomLawRange bind:value={state.cnt.value} min={2} max={20} step={1} law={customLaws.createPow(1.5)} /></td>
    </tr>
    <tr>
        <td>Center Radius:</td>
        <td><CustomLawRange bind:value={state.rc.value} min={10} max={200} step='any' law={customLaws.createPow(1.2)} /></td>
    </tr>
    <tr>
        <td>Other Radius:</td>
        <td><CustomLawRange bind:value={state.rb.value} min={10} max={200} step='any' law={customLaws.createPow(1.2)} /></td>
    </tr>
    <tr>
        <td>UI:</td>
    </tr>
    <tr>
        <td>Line Width:</td>
        <td><CustomLawRange bind:value={state.lineWidth.value} min={0.3} max={10} step='any' law={customLaws.createPow(1.7)} /></td>
    </tr>
    <tr>
        <td>Transition Duration:</td>
        <td><CustomLawRange bind:value={state.transition.value} min={0} max={1} step='any' law={customLaws.createPow(2)} /></td>
    </tr>
    <tr>
        <td>Rotation Speed:</td>
        <td><CustomLawRange bind:value={state.speed.value} min={-0.01} max={0.01} step='any' law={customLaws.linear} /></td>
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

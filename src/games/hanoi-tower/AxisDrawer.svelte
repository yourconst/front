<script lang="ts">
  import { onMount } from "svelte";

  export let axis: number[];
  export let axisIndex: number;
  export let selectedAxisIndex: number;
  export let ringsCount: number;
  export let onClick: (axisIndex: number) => void;
  export let darkSchema: boolean;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  $: {
    const updater = darkSchema || axis || axisIndex || selectedAxisIndex || ringsCount;

    draw();
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    onWindowResize();
    draw();
  });

  function onWindowResize() {
    const [w, h] = [window.screen.availWidth, window.screen.availHeight];

    canvas.width = w * 0.25;
    canvas.height = h / 3;

    draw();
  }

  export function draw() {
    if (!ctx) {
      return;
    }

    const selected = selectedAxisIndex === axisIndex;
    canvas.width = screen.width;
    canvas.height = screen.height;
    const [w, h] = [canvas.width, canvas.height];
    const cx = w / 2;

    const b = Math.min(w, h);

    const cnt = Math.max(7, ringsCount);

    const lineWidth = b / cnt / 2;
    const ringWidth = b / cnt;
    const ringHeight = Math.min(h / ringsCount, Math.max(20, b / cnt / 1.5));

    ctx.fillStyle = darkSchema ? '#404040' : '#e0e0e0';
    ctx.fillRect(cx - lineWidth / 2, 0, lineWidth, h);

    for (let i=0; i<axis.length; ++i) {
        if (selected && i === axis.length - 1) {
            ctx.fillStyle = darkSchema ? 'orange' : 'red';
        } else {
          ctx.fillStyle = darkSchema ? 'lightgray' : 'black';
        }

        const rw = ringWidth * axis[i];

        ctx.fillRect(cx - rw / 2, h - (i + 1) * ringHeight, rw, ringHeight);
    }
  }
</script>

<canvas bind:this={canvas}
  on:click|stopPropagation|preventDefault={() => onClick(axisIndex)}
  on:touchend|stopPropagation|preventDefault={() => onClick(axisIndex)}
></canvas>

<svelte:window on:resize={onWindowResize}></svelte:window>

<style>
  canvas {
      margin: 0px;
      padding: 0px;
      /* width: 30%; */
      display: inline-block;
      width: 30%;
  }

  canvas:hover {
      background: #191919;
  }

  @media (prefers-color-scheme: light) {
    canvas:hover {
        background: #f6f6f6;
    }
  }
</style>

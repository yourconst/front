<script lang="ts">
    export let style = '';
    export let bufferSize = 10;
    export let isPause = false;
    $: prevIsPause = !isPause;
    let value: string;

    const buffer = new Array<number>();
    let lastFrameTime = Date.now();

    export function onFrame() {
        if (prevIsPause !== isPause) {
            prevIsPause = isPause;
            lastFrameTime = Date.now() - (buffer.at(-1) || 0);
        }

        const time = Date.now();
        const dt = time - lastFrameTime;
        lastFrameTime = time;
        buffer.push(dt);

        if (buffer.length > bufferSize) {
            buffer.shift();
        }

        value = (
            1000 / (buffer.reduce((acc, v) => acc + v, 0) / buffer.length)
        ).toFixed(2);

        return dt;
    }
</script>

<div id='fpsMeter' {style}>{value}</div>

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

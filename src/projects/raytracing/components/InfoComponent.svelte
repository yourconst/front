<script lang="ts">
    export let text = '';
    export let style = '';

    $: isShow = false;

    export function show(txt: string) {
        text = txt;
        isShow = true;
    }

    export function hide() {
        isShow = false;
    }
</script>

<div id="info" style={`bottom: ${isShow ? '0px' : '-100px'};${style}`}>{text}</div>

<style>
    #info {
        transition: 0.3s;
        position: fixed;
        left: 50%;
        bottom: -100px;

        max-width: 80%;
        white-space: break-spaces;

        transform: translateX(-50%);

        padding: 10px;

        border-radius: 10px;

        font-family: 'Courier New', Courier, monospace;
        /* color: white; */
        background: white;
    }
</style>

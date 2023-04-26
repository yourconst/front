<script lang="ts">
    import { Helpers } from "../../../helpers/common";

    export let text = '';
    export let duration = 3000;
    export let style = '';

    const sleeper = new Helpers.SleeperChanging(duration);

    $: sleeper.duration = duration;
    $: show = !!text;

    $: {
        if (text) {
            show = true;

            if (!sleeper.isActive) {
                sleeper.sleep().then(() => show = false);
            }
        } else {
            sleeper.resolve();
        }
    }
</script>

<div id="info" style={`top: ${show ? '0px' : '-100px'};${style}`}>{text}</div>

<style>
    #info {
        transition: 0.3s;
        position: fixed;
        left: 50%;
        top: -100px;

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

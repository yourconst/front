<script lang="ts">
    import * as customLaws from './customLaws';
    import CustomLawRange from "./CustomLawRange.svelte";

    export let show = false;

    export let pause: boolean;

    export let resolution: number;
    export let fov: number;
    export let viewDistance: number;
    export let acceleration: number;
    export let accelerationBoost: number;
    export let timeMultiplier: number;
    export let lightOrbitPeriod: number;
    export let lightOrbitRadius: number;
    export let lightsCount: number;
    export let objectsCount: number;
</script>

<div id="menu" style={'right: ' + (show ? '0px' : '-380px')}>
    <table>
        <tr>
            <td>Pause</td>
            <td><input type='checkbox' bind:checked={pause} /></td>
        </tr>
        <tr>
            <td>Resolution</td>
            <td><CustomLawRange bind:value={resolution} min={0.1} max={2} step='any' law={customLaws.createPow(1.5)} /></td>
        </tr>
        <tr>
            <td>FOV</td>
            <td><CustomLawRange bind:value={fov} min={0.05} max={30} step='any' law={customLaws.createPow(2)} /></td>
        </tr>
        <tr>
            <td>View Distance</td>
            <td><CustomLawRange bind:value={viewDistance} min={0} max={1e15} step='any' law={customLaws.createPow(5)} /></td>
        </tr>
        <tr>
            <td>Acceleration</td>
            <td><CustomLawRange bind:value={acceleration} min={1} max={1e8} step='any' law={customLaws.createPow(2)} /></td>
        </tr>
        <tr>
            <td>Acceleration Boost</td>
            <td><CustomLawRange bind:value={accelerationBoost} min={2} max={10} step='any' law={customLaws.createPow(2)} /></td>
        </tr>
        <tr>
            <td>Time flow</td>
            <td><CustomLawRange bind:value={timeMultiplier} min={0} max={100} step='any' law={customLaws.createPow(3)} /></td>
        </tr>
        <tr>
            <td>Light orbit period</td>
            <td><CustomLawRange bind:value={lightOrbitPeriod} min={0} max={100} step='any' law={customLaws.createPow(2)} /></td>
        </tr>
        <tr>
            <td>Light orbit radius</td>
            <td><CustomLawRange bind:value={lightOrbitRadius} min={1e4} max={1e6} step='any' law={customLaws.createPow(2)} /></td>
        </tr>
        <tr>
            <td>Lights</td>
            <td><CustomLawRange bind:value={lightsCount} min={0} max={10} step={1} law={customLaws.linear} /></td>
        </tr>
        <tr>
            <td>Objects</td>
            <td><CustomLawRange bind:value={objectsCount} min={0} max={100} step={1} law={customLaws.linear} /></td>
        </tr>
    </table>
</div>

<div id="closeButton" on:click={e => show = !show}>=</div>

<style>
    #menu {
        display: block;
        position: absolute;
        top: 15vh;
        right: 0px;
        width: 360px;
        height: 70vh;

        padding: 10px;

        overflow-y: auto;

        transition: 0.3s;
        background: rgba(55, 55, 55, 0.7);

        border-top-left-radius: 15px;
        border-bottom-left-radius: 15px;

        color: white;
        font-family: 'Courier New', Courier, monospace;
    }

    #closeButton {
        display: block;
        position: absolute;
        top: 10px;
        right: 10px;

        font-size: 50px;

        color: white;
        font-family: 'Courier New', Courier, monospace;

        cursor: pointer;
    }
</style>

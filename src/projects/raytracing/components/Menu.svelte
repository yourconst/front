<script lang="ts">
    import CustomLawRange from "./CustomLawRange.svelte";
    import type { ExposureCalculator } from '../../../libs/render/ExposureCalculator';
  import { CustomLaw } from "./customLaws";

    export let show = false;

    export let pause: boolean;

    export let resolution: number;
    export let exposure: number;
    export let autoExposure: ExposureCalculator;
    export let fov: number;
    export let viewDistance: number;
    export let acceleration: number;
    export let accelerationBoost: number;
    export let timeMultiplier: number;

    export let stars: Record<string, boolean>;
    export let planets: Record<string, boolean>;
    export let lockViewOn: string = null;
    export let showDistanceTo: string = null;

    export let beSatelliteOf: (options: {
        centerName: string;
        distance: number;
        k: number;
    }) => void;

    const beSatelliteOfOptions = {
        centerName: null,
        distance: 1,
        k: 1.0,
    };

    $: selectedBodies = [
        ...Object.entries(stars).filter(([k,v]) => v).map(([k]) => k),
        ...Object.entries(planets).filter(([k,v]) => v).map(([k]) => k),
    ];

    function onMultipleSelect(
        e: Event & { currentTarget: EventTarget & HTMLSelectElement; },
        dictionary: Record<string, boolean>,
    ) {
        const t = e.currentTarget;

        for (const option of t.options) {
            dictionary[option.value] = option.selected;
        }

        return dictionary;
    }
</script>

<div id="menu" style={'right: ' + (show ? '0px' : '-420px')}>
    <table>
        <tr>
            <td>Pause</td>
            <td><input type='checkbox' bind:checked={pause} /></td>
        </tr>
        <tr>
            <td>Resolution</td>
            <td><CustomLawRange bind:value={resolution} min={0.1} max={2} step='any' law={CustomLaw.createPow(1.5)} /></td>
        </tr>
        <tr>
            <td>Exposure</td>
            <td><CustomLawRange bind:value={exposure} min={autoExposure.range.min} max={autoExposure.range.max} step='any' law={CustomLaw.createPow(2)} /></td>
        </tr>
        <tr>
            <td>Auto Exposure</td>
            <td><input type='checkbox' bind:checked={autoExposure.enabled} /></td>
        </tr>
        <tr>
            <td>Auto Exposure Brightness</td>
            <td><CustomLawRange bind:value={autoExposure.relativeTargetValue} min={0.01} max={1} step='any' law={CustomLaw.linear} /></td>
        </tr>
        <tr>
            <td>Auto Exposure Speed</td>
            <td><CustomLawRange bind:value={autoExposure.speed} min={0.01} max={1} step='any' law={CustomLaw.createPow(2)} /></td>
        </tr>
        <tr>
            <td>FOV</td>
            <td><CustomLawRange bind:value={fov} min={0.4} max={30} step='any' law={CustomLaw.createPow(2)} /></td>
        </tr>
        <tr>
            <td>View Distance</td>
            <td><CustomLawRange bind:value={viewDistance} min={0} max={1e15} step='any' law={CustomLaw.createPow(5)} /></td>
        </tr>
        <tr>
            <td>Acceleration</td>
            <td><CustomLawRange bind:value={acceleration} min={1} max={1e8} step='any' law={CustomLaw.createPow(2)} /></td>
        </tr>
        <tr>
            <td>Acceleration Boost</td>
            <td><CustomLawRange bind:value={accelerationBoost} min={2} max={10} step='any' law={CustomLaw.createPow(2)} /></td>
        </tr>
        <tr>
            <td>Time flow</td>
            <td><CustomLawRange bind:value={timeMultiplier} min={0} max={1000} step='any' law={CustomLaw.createPow(3)} /></td>
        </tr>
        <tr>
            <td>Stars</td>
            <td><select multiple={true} on:input={e => stars = onMultipleSelect(e, stars)}>
                {#each Object.keys(stars) as planet}
                    <option selected={stars[planet]} value={planet}>{planet}</option>
                {/each}
            </select></td>
        </tr>
        <tr>
            <td>Planets</td>
            <td><select multiple={true} on:input={e => planets = onMultipleSelect(e, planets)}>
                {#each Object.keys(planets) as planet}
                    <option selected={planets[planet]} value={planet}>{planet}</option>
                {/each}
            </select></td>
        </tr>
        <tr>
            <td>Lock view on</td>
            <td><select bind:value={lockViewOn}>
                {#each [null, ...selectedBodies] as body}
                    <option value={body}>{body}</option>
                {/each}
            </select></td>
        </tr>
        <tr>
            <td>Show distance to</td>
            <td><select bind:value={showDistanceTo}>
                {#each [null, ...selectedBodies] as body}
                    <option value={body}>{body}</option>
                {/each}
            </select></td>
        </tr>
        <tr>
            <td>
                <input type='button' value='Be satellite' disabled={!beSatelliteOfOptions.centerName}
                    on:click={() => beSatelliteOf(beSatelliteOfOptions)}
                />
            </td>
            <td>
                <select bind:value={beSatelliteOfOptions.centerName}>
                    {#each selectedBodies as body}
                        <option value={body}>{body}</option>
                    {/each}
                </select>
            </td>
        </tr>
        <tr><td>Orbit distance</td><td>
            <CustomLawRange bind:value={beSatelliteOfOptions.distance} min={1} max={1e11} step='any' law={CustomLaw.createPow(1.5)} />
        </td></tr>
        <tr><td>K</td><td>
            <CustomLawRange bind:value={beSatelliteOfOptions.k} min={0} max={3} step='any' law={CustomLaw.linear} />
        </td></tr>
    </table>
</div>

<div id="closeButton" on:click={e => show = !show}>=</div>

<style>
    #menu {
        display: block;
        position: absolute;
        top: 15vh;
        right: 0px;
        width: 400px;
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

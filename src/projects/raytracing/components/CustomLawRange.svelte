<script lang="ts">
  import { CustomLaw } from "./customLaws";

    export let value: number;
    export let min = 0;
    export let max = 1;
    export let step: number | 'any' = 'any';

    export let law = CustomLaw.linear;

    export let numberShow = true;
    export let defaultShow = true;
    export let defaultText = 'reset';
    export let style = '';
    export let numberStyle = 'width: 50px';

    $: {
        let validValue = Math.max(min, Math.min(max, value));
        
        if (step !== 'any') {
            validValue = min + (step * Math.trunc((validValue - min) / step));
        }

        if (validValue !== value) {
            value = validValue;
        }
    }

    const defaultValue = value;

    export function resetToDefaultValue() {
        value = defaultValue;
    }
</script>

{#if numberShow}
    <input type='number' bind:value={value} {min} {max} {step} style={numberStyle}/>
{/if}

<input
    type="range"
    value={law.to(value, min, max)} {min} {max} {step}
    {style}
    on:input={e => {
        value = law.from(e.target['value'], min, max);

        // if (step === 'any') {
        //     value = tmp;
        // } else {
        //     value = tmp - ((tmp - min) % step);
        // }
    }}
>

{#if defaultShow}
    <!-- <br /> -->
    <input type='button' bind:value={defaultText}
        on:click={resetToDefaultValue}
    />
{/if}

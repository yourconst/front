<script lang="ts">
    export let element: HTMLElement = null;
</script>

<svelte:document on:mousemove={e => {
    element = e.target;
}}></svelte:document>

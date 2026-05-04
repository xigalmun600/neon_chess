<script lang="ts">
	import FluidBackground from "$lib/components/FluidBackground.svelte";

	let { children } = $props();
</script>

<FluidBackground />
{@render children()}

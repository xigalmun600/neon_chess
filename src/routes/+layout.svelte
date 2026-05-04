<script lang="ts">
	import "../app.css";
	import "$lib/assets/grid-bg.css";
	import favicon from "$lib/assets/favicon.svg";
	import Navbar from "$lib/components/Navbar.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="relative min-h-screen bg-bg-dark font-display text-white">
	<div class="grid-bg pointer-events-none absolute inset-0 opacity-20"></div>
	<div class="relative z-10">
		<Navbar />
		{@render children()}
	</div>
</div>

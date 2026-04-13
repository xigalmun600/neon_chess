<script>
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";
	import { connect } from "$lib/state/socket.svelte";

	let { children } = $props();
	onMount(() => {
		connect();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

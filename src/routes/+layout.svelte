<script lang="ts">
	import "../app.css";
	import "$lib/assets/grid-bg.css";
	import favicon from "$lib/assets/favicon.svg";
	import Navbar from "$lib/components/Navbar.svelte";
	import InviteToast from "$lib/components/InviteToast.svelte";
	import { hydrateTheme } from "$lib/state/theme.svelte";
	import { connect, disconnect } from "$lib/state/ws-conn";
	import {
		startInvitesBridge,
		stopInvitesBridge,
	} from "$lib/state/challenge.svelte";
	import { onDestroy } from "svelte";

	let { data, children } = $props();

	$effect(() => {
		hydrateTheme(data.user);
	});

	$effect(() => {
		if (data.user) {
			startInvitesBridge();
			void connect().catch((e) => console.error("ws connect failed", e));
		} else {
			stopInvitesBridge();
			disconnect();
		}
	});

	onDestroy(() => {
		stopInvitesBridge();
		disconnect();
	});
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
	{#if data.user}
		<InviteToast />
	{/if}
</div>

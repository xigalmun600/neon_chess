<script lang="ts">
	import FluidBackground from "$lib/components/FluidBackground.svelte";
	import {
		theme,
		BOARDS,
		PIECES,
		DEFAULT_BOARD,
		DEFAULT_PIECE,
	} from "$lib/state/theme.svelte";

	let { children } = $props();

	const boardHref = $derived(BOARDS[theme.board] ?? BOARDS[DEFAULT_BOARD]);
	const pieceHref = $derived(PIECES[theme.piece] ?? PIECES[DEFAULT_PIECE]);
</script>

<svelte:head>
	<link rel="stylesheet" href={boardHref} />
	<link rel="stylesheet" href={pieceHref} />
</svelte:head>

<FluidBackground />
{@render children()}

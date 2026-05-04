<script lang="ts">
	import { rhythm, timeUntilNextBeatFor } from "$lib/state/rhythm.svelte";

	const whiteTime = $derived.by(() => {
		void rhythm.currentTime;
		return timeUntilNextBeatFor("white");
	});
	const blackTime = $derived.by(() => {
		void rhythm.currentTime;
		return timeUntilNextBeatFor("black");
	});
	const activeColor = $derived(
		rhythm.currentBeatIndex < rhythm.beatsTotal
			? rhythm.currentBeatIndex % 2 === 0
				? "white"
				: "black"
			: null,
	);

	function fmt(n: number | null): string {
		if (n == null) return "—";
		return n.toFixed(2) + "s";
	}
</script>

<div class="mb-4 flex items-center justify-center gap-8">
	<div
		class="flex flex-col items-center rounded-lg border border-border-muted bg-surface-dark/80 px-6 py-2 backdrop-blur-md transition"
		class:active-white={activeColor === "white"}
	>
		<span class="text-xs uppercase tracking-widest"
			class:text-primary={activeColor === "white"}
			class:text-gray-500={activeColor !== "white"}>White</span
		>
		<span
			class="font-mono text-2xl font-bold tabular-nums"
			class:text-primary={activeColor === "white"}
			class:text-gray-600={activeColor !== "white"}
			style={activeColor === "white" ? "text-shadow: 0 0 10px #00ffff;" : ""}
		>
			{fmt(whiteTime)}
		</span>
	</div>
	<div
		class="flex flex-col items-center rounded-lg border border-border-muted bg-surface-dark/80 px-6 py-2 backdrop-blur-md transition"
		class:active-black={activeColor === "black"}
	>
		<span class="text-xs uppercase tracking-widest"
			class:text-secondary={activeColor === "black"}
			class:text-gray-500={activeColor !== "black"}>Black</span
		>
		<span
			class="font-mono text-2xl font-bold tabular-nums"
			class:text-secondary={activeColor === "black"}
			class:text-gray-600={activeColor !== "black"}
			style={activeColor === "black" ? "text-shadow: 0 0 10px #ff00ff;" : ""}
		>
			{fmt(blackTime)}
		</span>
	</div>
</div>

<style>
	.active-white {
		border-color: rgba(0, 255, 255, 0.6);
		box-shadow: 0 0 12px rgba(0, 255, 255, 0.35);
	}
	.active-black {
		border-color: rgba(255, 0, 255, 0.6);
		box-shadow: 0 0 12px rgba(255, 0, 255, 0.35);
	}
</style>

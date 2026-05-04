<script lang="ts">
	import { rhythm, timeUntilNextBeatFor } from "$lib/state/rhythm.svelte";
	import { game } from "$lib/state/game.svelte";

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

	const badgeOpacity = $derived.by(() => {
		void rhythm.currentTime;
		if (!game.lastHit || !game.lastHitAt) return 0;
		const age = Date.now() - game.lastHitAt;
		if (age > 1200) return 0;
		return Math.max(0, 1 - age / 1200);
	});

	const gradeText: Record<string, string> = {
		perfect: "PERFECT!",
		great: "GREAT",
		good: "GOOD",
		ok: "OK",
		miss: "MISS",
	};

	const gradeStyle = $derived.by(() => {
		const g = game.lastHit?.grade;
		if (g === "perfect")
			return "color: #00ffff; text-shadow: 0 0 12px #00ffff;";
		if (g === "great")
			return "color: #ff00ff; text-shadow: 0 0 10px #ff00ff;";
		if (g === "good") return "color: #ffffff; text-shadow: 0 0 6px #ffffff;";
		return "color: #9ca3af;";
	});

	function fmt(n: number | null): string {
		if (n == null) return "—";
		return n.toFixed(2) + "s";
	}
</script>

<div class="mb-4 flex flex-col items-center gap-1">
	<div class="flex items-center justify-center gap-6">
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
			class="flex flex-col items-center rounded-lg border border-border-muted bg-surface-dark/80 px-6 py-2 backdrop-blur-md"
		>
			<span class="text-xs uppercase tracking-widest text-gray-400">Score</span>
			<span
				class="font-mono text-2xl font-bold tabular-nums text-white"
				style="text-shadow: 0 0 8px rgba(255,255,255,0.4);"
			>
				{game.score}
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

	<div
		class="font-mono text-sm font-bold uppercase tracking-widest"
		style={`opacity: ${badgeOpacity}; ${gradeStyle}`}
	>
		{#if game.lastHit}
			{gradeText[game.lastHit.grade]} +{game.lastHit.points}
		{:else}
			&nbsp;
		{/if}
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

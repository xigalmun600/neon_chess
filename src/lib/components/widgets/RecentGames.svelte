<script lang="ts">
	import type { Game } from "$lib/components/widgets/types";

	let { games }: { games: Game[] } = $props();

	const resultClass = {
		win: "border-primary/30 bg-primary/10 text-primary",
		loss: "border-secondary/30 bg-secondary/10 text-secondary",
		draw: "border-gray-500/30 bg-gray-500/10 text-gray-300",
	};
</script>

<div class="flex flex-col gap-3">
	<h4 class="px-2 text-sm font-bold uppercase tracking-widest text-gray-400">
		Recent Operations
	</h4>
	{#if games.length === 0}
		<div
			class="rounded-lg border border-dashed border-border-muted bg-surface-dark/50 p-6 text-center text-sm text-gray-500"
		>
			No games yet — deploy matchmaking to log your first operation.
		</div>
	{:else}
		{#each games as game, i (game.id ?? `idx-${i}-${game.opponent}`)}
			<div
				class="group flex cursor-pointer items-center justify-between rounded-lg border border-border-muted bg-surface-dark p-4 transition-all hover:border-primary/30 hover:bg-surface-light"
			>
				<div class="flex items-center gap-4">
					<div
						class="flex size-10 items-center justify-center rounded bg-surface-light text-gray-400"
					>
						<span class="material-symbols-outlined">person</span>
					</div>
					<div>
						<p class="mb-1 font-bold leading-none text-white">vs. {game.opponent}</p>
						<p class="font-mono text-xs text-gray-500">{game.timeControl}</p>
					</div>
				</div>
				<div class="flex items-center gap-6">
					{#if game.accuracy !== undefined}
						<div class="hidden flex-col items-end md:flex">
							<span class="text-xs font-bold uppercase text-gray-400">Accuracy</span>
							<span class="font-mono font-bold text-primary">{game.accuracy}%</span>
						</div>
					{/if}
					<div
						class="rounded border px-3 py-1 text-xs font-bold uppercase tracking-wider {resultClass[
							game.result
						]}"
					>
						{game.result}
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>

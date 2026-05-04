<script lang="ts">
	let {
		rating,
		theme,
	}: {
		rating: number;
		theme: string;
	} = $props();
</script>

<div
	class="group relative cursor-pointer overflow-hidden rounded-xl border border-border-muted bg-gradient-to-br from-surface-dark to-surface-light p-5"
>
	<div class="pointer-events-none absolute right-0 top-0 p-2 opacity-10">
		<span class="material-symbols-outlined !text-6xl">extension</span>
	</div>
	<p class="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
		Daily Training
	</p>
	<h4 class="mb-3 text-lg font-bold text-white">Puzzle of the Day</h4>
	<div class="mb-4 flex items-center gap-2">
		<span class="rounded bg-border-muted px-2 py-0.5 font-mono text-[10px] text-white">
			Rating: {rating}
		</span>
		<span class="rounded bg-border-muted px-2 py-0.5 font-mono text-[10px] text-white">
			{theme}
		</span>
	</div>
	<button
		class="w-full rounded border border-white/10 bg-white/5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-primary hover:text-black"
		disabled
		title="Coming soon"
	>
		Solve Now
	</button>
</div>

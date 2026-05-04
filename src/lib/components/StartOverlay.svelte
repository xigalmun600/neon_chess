<script lang="ts">
	let { onstart }: { onstart: () => void } = $props();
</script>

<div
	class="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
>
	<button
		type="button"
		onclick={onstart}
		class="flex flex-col items-center gap-3 rounded-2xl border border-primary bg-surface-dark/80 px-12 py-8 transition hover:bg-primary/10 hover:shadow-neon"
		style="text-shadow: 0 0 12px #00ffff;"
	>
		<span
			class="material-symbols-outlined !text-6xl text-primary"
			style="text-shadow: 0 0 18px #00ffff;">play_arrow</span
		>
		<span class="text-xl font-bold uppercase tracking-[0.2em] text-primary">
			Start
		</span>
		<span class="text-xs uppercase tracking-widest text-gray-400">
			Click to play
		</span>
	</button>
</div>

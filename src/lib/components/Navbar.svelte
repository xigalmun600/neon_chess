<script lang="ts">
	import { page } from "$app/state";

	const user = $derived(page.data.user as { username: string } | undefined);
	const initial = $derived((user?.username ?? "?")[0].toUpperCase());
</script>

<header
	class="sticky top-0 z-50 flex items-center justify-between border-b border-border-muted bg-surface-dark/80 px-6 py-3 backdrop-blur-md"
>
	<a href="/" class="flex items-center gap-3 text-white">
		<span
			class="material-symbols-outlined !text-3xl text-primary"
			style="text-shadow: 0 0 10px #00ffff;">diamond</span
		>
		<h2 class="text-xl font-bold tracking-[0.05em]">NEON CHESS</h2>
	</a>

	<nav class="hidden items-center gap-8 md:flex">
		<a
			href="/"
			class="border-b-2 border-primary pb-1 text-sm font-bold uppercase tracking-widest text-primary"
		>
			Dashboard
		</a>
		<a
			href="/game?mode=human"
			class="text-sm font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-white"
		>
			Play
		</a>
		<span
			class="cursor-not-allowed text-sm font-medium uppercase tracking-widest text-gray-600"
			title="Coming soon">Puzzles</span
		>
		<span
			class="cursor-not-allowed text-sm font-medium uppercase tracking-widest text-gray-600"
			title="Coming soon">Learn</span
		>
	</nav>

	<div class="flex items-center gap-3">
		<div class="hidden flex-col items-end leading-tight sm:flex">
			<span class="text-xs uppercase tracking-widest text-gray-500">Operative</span>
			<span class="text-sm font-bold text-white">{user?.username ?? "guest"}</span>
		</div>
		<div class="relative">
			<div
				class="flex size-10 items-center justify-center rounded-lg border border-border-muted bg-surface-light font-bold text-primary"
				style="text-shadow: 0 0 8px #00ffff;"
			>
				{initial}
			</div>
			<div
				class="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-surface-dark bg-primary"
				style="box-shadow: 0 0 6px #00ffff;"
			></div>
		</div>
	</div>
</header>

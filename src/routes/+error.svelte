<script lang="ts">
	import { page } from "$app/state";
	import { m } from "$lib/paraglide/messages";
</script>

<svelte:head>
	<title>{page.status} — Neon Chess</title>
</svelte:head>

<main
	class="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col items-center justify-center gap-4 px-6 py-12 text-center"
>
	<h1
		class="text-6xl font-bold text-secondary"
		style="text-shadow: 0 0 12px #ff00ff;"
	>
		{page.status}
	</h1>
	<p class="text-sm uppercase tracking-widest text-gray-400">
		{page.error?.message ?? m.error_default()}
	</p>
	<a
		href="/"
		class="mt-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary transition hover:bg-primary/20"
	>
		{m.error_backHome()}
	</a>
</main>

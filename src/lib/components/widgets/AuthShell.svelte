<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		title,
		subtitle,
		error,
		submitLabel,
		footer,
		children,
	}: {
		title: string;
		subtitle: string;
		error?: string | null;
		submitLabel: string;
		footer: Snippet;
		children: Snippet;
	} = $props();
</script>

<main class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col items-center justify-center px-6">
	<div class="w-full rounded-xl border border-border-muted bg-surface-dark/80 p-8 backdrop-blur-md">
		<h1
			class="text-3xl font-bold uppercase tracking-widest text-cyan-300"
			style="text-shadow: 0 0 12px rgba(0, 255, 255, 0.6);"
		>
			{title}
		</h1>
		<p class="mt-1 mb-6 text-sm uppercase tracking-widest text-gray-400">{subtitle}</p>

		{#if error}
			<div
				class="mb-4 rounded border border-secondary/40 bg-secondary/10 px-3 py-2 text-sm text-secondary"
				role="alert"
			>
				{error}
			</div>
		{/if}

		<form method="POST" class="flex flex-col gap-4">
			{@render children()}
			<button
				type="submit"
				class="mt-2 rounded-lg border border-primary bg-primary/10 py-3 text-sm font-bold uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-black hover:shadow-neon"
			>
				{submitLabel}
			</button>
		</form>

		<div class="mt-6 text-center text-sm text-gray-400">
			{@render footer()}
		</div>
	</div>
</main>

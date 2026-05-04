<script lang="ts">
	type Accent = "primary" | "secondary" | "white";

	let {
		label,
		value,
		suffix = "",
		trend,
		icon,
		accent = "primary",
	}: {
		label: string;
		value: string | number;
		suffix?: string;
		trend?: { text: string; positive?: boolean };
		icon: string;
		accent?: Accent;
	} = $props();

	const accentText = $derived(
		{
			primary: "text-primary",
			secondary: "text-secondary",
			white: "text-white",
		}[accent],
	);
	const trendBg = $derived(
		trend?.positive === false
			? "bg-secondary/10 text-secondary"
			: "bg-primary/10 text-primary",
	);
</script>

<div
	class="group relative overflow-hidden rounded-xl border border-border-muted bg-surface-dark p-6 transition-all duration-300 hover:border-primary/50"
>
	<div
		class="pointer-events-none absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20"
	>
		<span class="material-symbols-outlined !text-6xl {accentText}">{icon}</span>
	</div>
	<p class="mb-1 text-sm font-medium uppercase tracking-widest text-gray-400">
		{label}
	</p>
	<div class="flex items-end gap-3">
		<p
			class="text-4xl font-bold tracking-tighter text-white"
			style="text-shadow: 0 0 15px rgba(0, 255, 255, 0.3);"
		>
			{value}{#if suffix}<span class="text-xl text-gray-500">{suffix}</span>{/if}
		</p>
		{#if trend}
			<span
				class="mb-1 flex items-center rounded px-1.5 py-0.5 text-sm font-bold {trendBg}"
			>
				{trend.text}
			</span>
		{/if}
	</div>
</div>

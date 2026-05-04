<script lang="ts">
	type Accent = "primary" | "secondary";

	let {
		href,
		title,
		subtitle,
		icon,
		accent = "primary",
	}: {
		href: string;
		title: string;
		subtitle: string;
		icon: string;
		accent?: Accent;
	} = $props();

	const ring = $derived(
		accent === "primary"
			? "border-primary/40 hover:border-primary hover:shadow-neon"
			: "border-secondary/40 hover:border-secondary hover:shadow-neon-magenta",
	);
	const iconColor = $derived(accent === "primary" ? "text-primary" : "text-secondary");
	const labelColor = $derived(accent === "primary" ? "text-primary" : "text-secondary");
</script>

<a
	{href}
	class="group relative flex items-center gap-5 overflow-hidden rounded-xl border bg-surface-dark p-6 transition-all duration-300 {ring}"
>
	<div
		class="flex size-14 items-center justify-center rounded-lg border border-border-muted bg-surface-light"
	>
		<span class="material-symbols-outlined !text-3xl {iconColor}">{icon}</span>
	</div>
	<div class="flex-1">
		<p class="text-xs font-bold uppercase tracking-widest {labelColor}">
			{subtitle}
		</p>
		<h3 class="text-xl font-bold tracking-wide text-white">{title}</h3>
	</div>
	<span
		class="material-symbols-outlined text-gray-500 transition-transform group-hover:translate-x-1 group-hover:{iconColor}"
		>arrow_forward</span
	>
</a>

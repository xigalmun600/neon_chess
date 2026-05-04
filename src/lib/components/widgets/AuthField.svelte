<script lang="ts">
	let {
		name,
		label,
		type = "text",
		value = "",
		autocomplete,
		minlength,
		maxlength,
		required = true,
	}: {
		name: string;
		label: string;
		type?: string;
		value?: string;
		autocomplete?: import("svelte/elements").FullAutoFill;
		minlength?: number;
		maxlength?: number;
		required?: boolean;
	} = $props();
</script>

<label class="flex flex-col gap-1">
	<span class="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</span>
	<input
		{name}
		{type}
		{required}
		{minlength}
		{maxlength}
		{autocomplete}
		{value}
		class="rounded-lg border border-border-muted bg-surface-light px-3 py-2 text-white outline-none transition-colors focus:border-primary/60"
	/>
</label>

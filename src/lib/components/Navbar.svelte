<script lang="ts">
	import { page } from "$app/state";
	import logo from "$lib/assets/logo.svg";

	const user = $derived(
		page.data.user as { username: string } | null | undefined,
	);
	const initial = $derived((user?.username ?? "?")[0].toUpperCase());
</script>

<header
	class="sticky top-0 z-50 flex items-center justify-between border-b border-border-muted bg-surface-dark/80 px-6 py-3 backdrop-blur-md"
>
	<a href="/" class="flex items-center gap-3 text-white">
		<img
			src={logo}
			alt=""
			class="h-8 w-8"
			style="filter: drop-shadow(0 0 10px #00ffff);"
		/>
		<h2 class="text-xl font-bold tracking-[0.05em]">NEON CHESS</h2>
	</a>

	{#if user}
		<div class="flex items-center gap-3">
			<div class="hidden flex-col items-end leading-tight sm:flex">
				<span class="text-xs uppercase tracking-widest text-gray-500"
					>Operative</span
				>
				<span class="text-sm font-bold text-white">{user.username}</span>
			</div>
			<a
				href="/challenge"
				title="Challenge"
				class="relative flex size-10 items-center justify-center rounded-lg border border-border-muted bg-surface-light text-gray-400 transition hover:border-primary hover:text-primary"
			>
				<span class="material-symbols-outlined !text-xl">swords</span>
			</a>
			<a
				href="/settings"
				title="Settings"
				class="relative block"
			>
				<div
					class="flex size-10 items-center justify-center rounded-lg border border-border-muted bg-surface-light font-bold text-primary transition hover:border-primary hover:shadow-neon-sm"
					style="text-shadow: 0 0 8px #00ffff;"
				>
					{initial}
				</div>
				<div
					class="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-surface-dark bg-primary"
					style="box-shadow: 0 0 6px #00ffff;"
				></div>
			</a>
			<form method="POST" action="/logout">
				<button
					type="submit"
					title="Log out"
					class="flex size-10 items-center justify-center rounded-lg border border-border-muted bg-surface-light text-gray-400 transition hover:border-secondary hover:text-secondary"
				>
					<span class="material-symbols-outlined !text-xl">logout</span>
				</button>
			</form>
		</div>
	{:else}
		<div class="flex items-center gap-2">
			<a
				href="/login"
				class="rounded-lg border border-border-muted bg-surface-light px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition hover:border-primary hover:text-primary"
			>
				Log in
			</a>
			<a
				href="/register"
				class="rounded-lg border border-primary bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-primary/20 hover:shadow-neon-sm"
				style="text-shadow: 0 0 6px #00ffff;"
			>
				Register
			</a>
		</div>
	{/if}
</header>

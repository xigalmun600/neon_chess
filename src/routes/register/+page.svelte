<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Register — Neon Chess</title>
</svelte:head>

<main class="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-12">
	<div
		class="w-full max-w-md rounded-2xl border border-border-muted bg-surface-dark/80 p-8 shadow-neon-sm backdrop-blur-md"
	>
		<div class="mb-6 text-center">
			<span
				class="material-symbols-outlined !text-4xl text-primary"
				style="text-shadow: 0 0 12px #00ffff;">person_add</span
			>
			<h1 class="mt-2 text-2xl font-bold tracking-[0.05em] text-white">
				REGISTER
			</h1>
			<p class="mt-1 text-xs uppercase tracking-widest text-gray-500">
				Claim your operative ID
			</p>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
			class="flex flex-col gap-4"
		>
			<label class="flex flex-col gap-1">
				<span class="text-xs uppercase tracking-widest text-gray-400"
					>Username</span
				>
				<input
					type="text"
					name="username"
					autocomplete="username"
					minlength="3"
					maxlength="50"
					pattern="[a-zA-Z0-9_]+"
					required
					value={form?.username ?? ""}
					class="rounded-lg border border-border-muted bg-surface-light px-3 py-2 text-white outline-none transition focus:border-primary focus:shadow-neon-sm"
				/>
				<span class="text-[10px] uppercase tracking-wider text-gray-500"
					>3–50 chars · letters, digits, underscore</span
				>
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-xs uppercase tracking-widest text-gray-400"
					>Email</span
				>
				<input
					type="email"
					name="email"
					autocomplete="email"
					maxlength="100"
					required
					value={form?.email ?? ""}
					class="rounded-lg border border-border-muted bg-surface-light px-3 py-2 text-white outline-none transition focus:border-primary focus:shadow-neon-sm"
				/>
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-xs uppercase tracking-widest text-gray-400"
					>Password</span
				>
				<input
					type="password"
					name="password"
					autocomplete="new-password"
					minlength="8"
					maxlength="255"
					required
					class="rounded-lg border border-border-muted bg-surface-light px-3 py-2 text-white outline-none transition focus:border-primary focus:shadow-neon-sm"
				/>
				<span class="text-[10px] uppercase tracking-wider text-gray-500"
					>8 chars minimum</span
				>
			</label>

			{#if form?.error}
				<p class="text-sm text-secondary" style="text-shadow: 0 0 6px #ff00ff;">
					{form.error}
				</p>
			{/if}

			<button
				type="submit"
				disabled={submitting}
				class="mt-2 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary transition hover:bg-primary/20 hover:shadow-neon disabled:opacity-50"
				style="text-shadow: 0 0 8px #00ffff;"
			>
				{submitting ? "Registering…" : "Register"}
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-gray-400">
			Already have an account?
			<a
				href="/login"
				class="font-bold text-primary hover:underline"
				style="text-shadow: 0 0 6px #00ffff;">Log in</a
			>
		</p>
	</div>
</main>

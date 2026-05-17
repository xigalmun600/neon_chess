<script lang="ts">
	import StatCard from "$lib/components/widgets/StatCard.svelte";
	import PlayCard from "$lib/components/widgets/PlayCard.svelte";
	import RecentGames from "$lib/components/widgets/RecentGames.svelte";
	import { m } from "$lib/paraglide/messages";

	let { data } = $props();
</script>

<main class="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-10">
	<section class="mb-10">
		<h1
			class="text-5xl font-bold uppercase tracking-widest text-cyan-300"
			style="text-shadow: 0 0 15px rgba(0, 255, 255, 0.6);"
		>
			Neon Chess
		</h1>
		<p class="mt-2 text-sm uppercase tracking-widest text-gray-400">
			{m.home_tagline()}
		</p>
	</section>

	<section class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
		<StatCard
			label={m.home_currentElo()}
			value={data.stats.elo}
			icon="bolt"
			accent="primary"
		/>
		<StatCard
			label={m.home_globalRank()}
			value={data.stats.rank ?? "—"}
			icon="public"
			accent="white"
		/>
		<StatCard
			label={m.home_winRate()}
			value={data.stats.winRate ?? "—"}
			suffix={data.stats.winRate !== null ? "%" : ""}
			icon="flare"
			accent="secondary"
		/>
	</section>

	<section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
		<div class="flex flex-col gap-6 xl:col-span-2">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<PlayCard
					href="/game?mode=human"
					title={m.home_playHuman()}
					subtitle={m.home_playHumanSub()}
					icon="swords"
					accent="primary"
				/>
				<PlayCard
					href="/game?mode=machine"
					title={m.home_playMachine()}
					subtitle={m.home_playMachineSub()}
					icon="memory"
					accent="secondary"
				/>
			</div>
			<RecentGames games={data.recentGames} />
		</div>
	</section>
</main>

<script lang="ts">
	import StatCard from "$lib/components/widgets/StatCard.svelte";
	import PlayCard from "$lib/components/widgets/PlayCard.svelte";
	import RecentGames from "$lib/components/widgets/RecentGames.svelte";

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
			Play chess with your friends.
		</p>
	</section>

	<section class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
		<StatCard
			label="Current Elo"
			value={data.stats.elo}
			icon="bolt"
			accent="primary"
		/>
		<StatCard
			label="Global Rank"
			value={data.stats.rank ?? "—"}
			icon="public"
			accent="white"
		/>
		<StatCard
			label="Win Rate"
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
					title="Play vs Human"
					subtitle="Online matchmaking"
					icon="swords"
					accent="primary"
				/>
				<PlayCard
					href="/game?mode=machine"
					title="Play vs Machine"
					subtitle="Stockfish engine"
					icon="memory"
					accent="secondary"
				/>
			</div>
			<RecentGames games={data.recentGames} />
		</div>
	</section>
</main>

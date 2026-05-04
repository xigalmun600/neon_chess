import type { Game } from "$lib/components/widgets/types";

// TODO: replace mocks once games/elo schema lands.
export const load = async () => {
	return {
		stats: {
			elo: 1200,
			rank: null as number | null,
			winRate: null as number | null,
		},
		recentGames: [] as Game[],
		puzzle: { rating: 2100, theme: "Mate in 3" },
	};
};

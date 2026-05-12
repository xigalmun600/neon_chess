import { and, desc, eq, gt, or, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import { game, player } from "$lib/server/db/schema";
import type { Game } from "$lib/components/widgets/types";
import type { PageServerLoad } from "./$types";

const DEFAULT_ELO = 1200;

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return {
      stats: {
        elo: DEFAULT_ELO,
        rank: null as number | null,
        winRate: null as number | null,
      },
      recentGames: [] as Game[],
    };
  }

  const uid = locals.user.id;

  const [me] = await db
    .select({ elo: player.elo, gamesPlayed: player.gamesPlayed })
    .from(player)
    .where(eq(player.id, uid));

  if (!me) {
    return {
      stats: { elo: DEFAULT_ELO, rank: null, winRate: null },
      recentGames: [] as Game[],
    };
  }

  const [rankRow, statsRow, recent] = await Promise.all([
    me.gamesPlayed >= 1
      ? db
          .select({ rank: sql<number>`1 + count(*)::int` })
          .from(player)
          .where(and(gt(player.elo, me.elo), gt(player.gamesPlayed, 0)))
          .then((r) => r[0])
      : Promise.resolve({ rank: null as number | null }),
    db
      .select({
        wins: sql<number>`coalesce(sum(case when (${game.whiteId} = ${uid} and ${game.result} = 'white') or (${game.blackId} = ${uid} and ${game.result} = 'black') then 1 else 0 end), 0)::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(game)
      .where(or(eq(game.whiteId, uid), eq(game.blackId, uid)))
      .then((r) => r[0]),
    db
      .select({
        whiteId: game.whiteId,
        blackId: game.blackId,
        result: game.result,
        whiteName: sql<string>`white_p.username`,
        blackName: sql<string>`black_p.username`,
      })
      .from(game)
      .innerJoin(
        sql`${player} as white_p`,
        sql`white_p.id = ${game.whiteId}`,
      )
      .innerJoin(
        sql`${player} as black_p`,
        sql`black_p.id = ${game.blackId}`,
      )
      .where(or(eq(game.whiteId, uid), eq(game.blackId, uid)))
      .orderBy(desc(game.createdAt))
      .limit(5),
  ]);

  const winRate =
    statsRow.total > 0
      ? Math.round((statsRow.wins / statsRow.total) * 100)
      : null;

  const recentGames: Game[] = recent.map((row) => {
    const wasWhite = row.whiteId === uid;
    const opponent = wasWhite ? row.blackName : row.whiteName;
    const result: Game["result"] =
      row.result === "draw"
        ? "draw"
        : (row.result === "white") === wasWhite
          ? "win"
          : "loss";
    return { opponent, timeControl: "—", result };
  });

  return {
    stats: {
      elo: me.elo,
      rank: rankRow.rank,
      winRate,
    },
    recentGames,
  };
};

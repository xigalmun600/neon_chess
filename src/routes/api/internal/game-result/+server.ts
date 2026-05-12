import { json, error } from "@sveltejs/kit";
import { eq, inArray, sql } from "drizzle-orm";
import { INTERNAL_API_SECRET } from "$env/static/private";
import { db } from "$lib/server/db";
import { game, player } from "$lib/server/db/schema";
import { computeElo, type GameResult } from "$lib/server/elo";
import type { RequestHandler } from "./$types";

type Body = {
  whiteId: number;
  blackId: number;
  result: GameResult;
  endReason: string;
};

const VALID_REASONS = new Set([
  "checkmate",
  "stalemate",
  "threefold",
  "insufficient",
  "fifty_move",
  "resign",
  "timeout",
  "disconnect",
]);

export const POST: RequestHandler = async ({ request }) => {
  if (request.headers.get("x-internal-secret") !== INTERNAL_API_SECRET) {
    throw error(401, "unauthorized");
  }

  const body = (await request.json()) as Partial<Body>;
  const { whiteId, blackId, result, endReason } = body;

  if (
    typeof whiteId !== "number" ||
    typeof blackId !== "number" ||
    whiteId === blackId ||
    (result !== "white" && result !== "black" && result !== "draw") ||
    typeof endReason !== "string" ||
    !VALID_REASONS.has(endReason)
  ) {
    throw error(400, "bad request");
  }

  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: player.id, elo: player.elo })
      .from(player)
      .where(inArray(player.id, [whiteId, blackId]))
      .for("update");

    const whiteRow = rows.find((r) => r.id === whiteId);
    const blackRow = rows.find((r) => r.id === blackId);
    if (!whiteRow || !blackRow) throw error(404, "player not found");

    const { whiteAfter, blackAfter } = computeElo(
      whiteRow.elo,
      blackRow.elo,
      result,
    );

    await tx.insert(game).values({
      whiteId,
      blackId,
      result,
      whiteEloBefore: whiteRow.elo,
      blackEloBefore: blackRow.elo,
      whiteEloAfter: whiteAfter,
      blackEloAfter: blackAfter,
      endReason,
    });

    await tx
      .update(player)
      .set({ elo: whiteAfter, gamesPlayed: sql`${player.gamesPlayed} + 1` })
      .where(eq(player.id, whiteId));

    await tx
      .update(player)
      .set({ elo: blackAfter, gamesPlayed: sql`${player.gamesPlayed} + 1` })
      .where(eq(player.id, blackId));
  });

  return json({ ok: true });
};

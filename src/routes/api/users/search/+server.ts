import { error, json } from "@sveltejs/kit";
import { and, ilike, ne } from "drizzle-orm";
import { db } from "$lib/server/db";
import { player } from "$lib/server/db/schema";
import { m } from "$lib/paraglide/messages";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) throw error(401, m.api_notAuthenticated());
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 1 || q.length > 50) {
    return json({ results: [] });
  }

  const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
  const pattern = `${escaped}%`;

  const results = await db
    .select({ id: player.id, username: player.username, elo: player.elo })
    .from(player)
    .where(and(ilike(player.username, pattern), ne(player.id, locals.user.id)))
    .orderBy(player.username)
    .limit(10);

  return json({ results });
};

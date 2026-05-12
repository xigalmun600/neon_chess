import { error, json } from "@sveltejs/kit";
import { issueTicket } from "$lib/server/ws-ticket";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, "not authenticated");
  return json({
    ticket: await issueTicket(locals.user.id, locals.user.username),
  });
};

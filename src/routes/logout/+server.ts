import { error, redirect } from "@sveltejs/kit";
import { SESSION_COOKIE, invalidateSession } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, cookies }) => {
	if (locals.session) await invalidateSession(locals.session.id);
	cookies.delete(SESSION_COOKIE, { path: "/" });
	throw redirect(303, "/");
};

export const GET: RequestHandler = () => {
	throw error(405, "Use POST to log out.");
};

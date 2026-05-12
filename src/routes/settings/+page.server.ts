import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { player } from "$lib/server/db/schema";
import { BOARDS, PIECES } from "$lib/state/theme-catalog";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) throw redirect(303, "/login");
	return {
		user: locals.user,
		boards: Object.keys(BOARDS).sort(),
		pieces: Object.keys(PIECES).sort(),
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, "/login");
		const form = await request.formData();
		const boardTheme = String(form.get("boardTheme") ?? "");
		const pieceTheme = String(form.get("pieceTheme") ?? "");

		if (!BOARDS[boardTheme]) {
			return fail(400, { error: "Invalid board theme." });
		}
		if (!PIECES[pieceTheme]) {
			return fail(400, { error: "Invalid piece set." });
		}

		await db
			.update(player)
			.set({ boardTheme, pieceTheme })
			.where(eq(player.id, locals.user.id));

		return { success: true };
	},
};

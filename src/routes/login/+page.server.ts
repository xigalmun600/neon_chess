import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { player } from "$lib/server/db/schema";
import {
	SESSION_COOKIE,
	SESSION_COOKIE_OPTIONS,
	createSession,
	generateSessionToken,
	verifyPassword,
} from "$lib/server/auth";
import { m } from "$lib/paraglide/messages";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) throw redirect(303, "/");
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const identifier = String(form.get("identifier") ?? "").trim().toLowerCase();
		const password = String(form.get("password") ?? "");

		if (!identifier || !password) {
			return fail(400, { identifier, error: m.login_errorEnterCreds() });
		}

		const isEmail = identifier.includes("@");
		const [row] = await db
			.select({
				id: player.id,
				username: player.username,
				passwordHash: player.passwordHash,
			})
			.from(player)
			.where(
				isEmail ? eq(player.email, identifier) : eq(player.username, identifier),
			)
			.limit(1);

		// Run argon2 on a dummy hash when the user doesn't exist so the response
		// time doesn't leak account existence.
		const fakeHash =
			"$argon2id$v=19$m=19456,t=2,p=1$ZmFrZWZha2VmYWtlZmFrZQ$0000000000000000000000000000000000000000000";
		const ok = await verifyPassword(row?.passwordHash ?? fakeHash, password);

		if (!row || !ok) {
			return fail(400, { identifier, error: m.login_errorInvalid() });
		}

		const token = generateSessionToken();
		const sess = await createSession(token, row.id);
		cookies.set(SESSION_COOKIE, token, {
			...SESSION_COOKIE_OPTIONS,
			expires: sess.expiresAt,
		});

		throw redirect(303, "/");
	},
};

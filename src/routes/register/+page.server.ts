import { fail, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { player } from "$lib/server/db/schema";
import {
	SESSION_COOKIE,
	SESSION_COOKIE_OPTIONS,
	createSession,
	generateSessionToken,
	hashPassword,
} from "$lib/server/auth";
import { m } from "$lib/paraglide/messages";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) throw redirect(303, "/");
	return {};
};

const USERNAME_RE = /^[a-zA-Z0-9_]{3,50}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const actions: Actions = {
	default: async ({ request, cookies, locals }) => {
		const form = await request.formData();
		const username = String(form.get("username") ?? "").trim();
		const email = String(form.get("email") ?? "").trim().toLowerCase();
		const password = String(form.get("password") ?? "");

		if (!USERNAME_RE.test(username)) {
			return fail(400, {
				email,
				username,
				error: m.register_errorUsername(),
			});
		}
		if (!EMAIL_RE.test(email) || email.length > 100) {
			return fail(400, { email, username, error: m.register_errorEmail() });
		}
		if (password.length < 8 || password.length > 255) {
			return fail(400, {
				email,
				username,
				error: m.register_errorPassword(),
			});
		}

		const passwordHash = await hashPassword(password);

		let userId: number;
		try {
			const [row] = await db
				.insert(player)
				.values({ username, email, passwordHash, language: locals.locale })
				.returning({ id: player.id });
			userId = row.id;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			const taken = /duplicate key|unique/i.test(msg)
				? /username/i.test(msg)
					? m.register_errorUsernameTaken()
					: m.register_errorEmailTaken()
				: m.register_errorGeneric();
			return fail(409, { email, username, error: taken });
		}

		const token = generateSessionToken();
		const sess = await createSession(token, userId);
		cookies.set(SESSION_COOKIE, token, {
			...SESSION_COOKIE_OPTIONS,
			expires: sess.expiresAt,
		});

		throw redirect(303, "/");
	},
};

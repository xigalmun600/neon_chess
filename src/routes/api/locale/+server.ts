import { error, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { player } from "$lib/server/db/schema";
import {
	LOCALE_COOKIE,
	LOCALE_COOKIE_OPTIONS,
	isLocale,
} from "$lib/server/locale";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	const body = (await request.json().catch(() => null)) as
		| { locale?: unknown }
		| null;
	const locale = body?.locale;
	if (!isLocale(locale)) throw error(400, "invalid locale");

	cookies.set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);

	if (locals.user) {
		await db
			.update(player)
			.set({ language: locale })
			.where(eq(player.id, locals.user.id));
	}

	return json({ ok: true, locale });
};

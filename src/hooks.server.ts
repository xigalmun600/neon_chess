import type { Handle } from "@sveltejs/kit";
import {
	SESSION_COOKIE,
	SESSION_COOKIE_OPTIONS,
	validateSessionToken,
} from "$lib/server/auth";

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	if (!token) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const result = await validateSessionToken(token);
	if (result) {
		event.locals.user = result.user;
		event.locals.session = result.session;
		event.cookies.set(SESSION_COOKIE, token, {
			...SESSION_COOKIE_OPTIONS,
			expires: result.session.expiresAt,
		});
	} else {
		event.locals.user = null;
		event.locals.session = null;
		event.cookies.delete(SESSION_COOKIE, { path: "/" });
	}

	return resolve(event);
};

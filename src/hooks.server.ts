import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import {
	SESSION_COOKIE,
	SESSION_COOKIE_OPTIONS,
	validateSessionToken,
} from "$lib/server/auth";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { getLocale } from "$lib/paraglide/runtime";

const sessionHandle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	if (!token) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
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
	}

	event.locals.locale = getLocale();
	return resolve(event);
};

const paraglideHandle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace("%lang%", locale),
		});
	});

export const handle = sequence(paraglideHandle, sessionHandle);

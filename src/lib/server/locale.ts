import type { Locale } from "$lib/paraglide/runtime";

export const LOCALE_COOKIE = "lang";
export const LOCALES = ["es", "en"] as const satisfies readonly Locale[];

export function isLocale(value: unknown): value is Locale {
	return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export const LOCALE_COOKIE_OPTIONS = {
	path: "/",
	httpOnly: false,
	sameSite: "lax",
	maxAge: 60 * 60 * 24 * 365,
} as const;

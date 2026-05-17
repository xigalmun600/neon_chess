import {
	getLocale as paraglideGetLocale,
	overwriteGetLocale,
	type Locale,
} from "$lib/paraglide/runtime";

// Reactive mirror of the active Paraglide locale. We overwrite Paraglide's
// `getLocale()` so every `m.*` template call re-runs when this $state flips
// — no full reload needed when the user clicks the Navbar switcher.
const state = $state({ locale: undefined as Locale | undefined });

let installed = false;

export function installReactiveLocale(initial: Locale): void {
	if (installed) {
		state.locale = initial;
		return;
	}
	state.locale = initial;
	overwriteGetLocale(() => state.locale ?? paraglideGetLocale());
	installed = true;
}

export function setReactiveLocale(locale: Locale): void {
	state.locale = locale;
}

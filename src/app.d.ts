// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { SessionRecord, SessionUser } from "$lib/server/auth";
import type { Locale } from "$lib/paraglide/runtime";

declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
			session: SessionRecord | null;
			locale: Locale;
		}
		interface PageData {
			user: SessionUser | null;
			locale: Locale;
		}
	}
	interface Window {
		// Test-time disable flag for FluidBackground's WebGL canvas. Set via
		// page.addInitScript in Playwright fixtures — headless Chromium's GPU
		// process stalls on long ReadPixels calls and deadlocks CDP.
		__NEON_CHESS_NO_FLUID__?: boolean;
	}
}

export {};

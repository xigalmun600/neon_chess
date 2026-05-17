// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { SessionRecord, SessionUser } from "$lib/server/auth";

declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
			session: SessionRecord | null;
		}
		interface PageData {
			user: SessionUser | null;
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

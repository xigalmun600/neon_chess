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
}

export {};

import { expect, type Page } from "@playwright/test";

export type TestUser = { username: string; email: string; password: string };

export function makeUser(): TestUser {
	const tag = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
	return {
		username: `u_${tag}`,
		email: `u_${tag}@example.test`,
		password: "Passw0rd!test",
	};
}

export async function disableFluidBackground(page: Page): Promise<void> {
	// FluidBackground's WebGL hammers the headless GPU process and stalls
	// CDP. Set this flag before any navigation so the component bails on mount.
	await page.addInitScript(() => {
		(window as unknown as { __NEON_CHESS_NO_FLUID__?: boolean }).__NEON_CHESS_NO_FLUID__ =
			true;
	});
}

export async function registerUser(page: Page): Promise<TestUser> {
	await disableFluidBackground(page);
	const user = makeUser();
	await page.goto("/register");
	await page.waitForLoadState("networkidle");
	await page.locator('input[name="username"]').fill(user.username);
	await page.locator('input[name="email"]').fill(user.email);
	await page.locator('input[name="password"]').fill(user.password);
	await page.getByRole("button", { name: /register/i }).click();
	await page.waitForURL((url) => url.pathname === "/", { timeout: 10_000 });
	await expect(page.locator("header").getByText(user.username)).toBeVisible();
	return user;
}

export async function logout(page: Page) {
	await page.locator('header form[action="/logout"] button[type="submit"]').click();
	await page.waitForURL((url) => url.pathname === "/", { timeout: 10_000 });
	await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
}

export async function loginUser(page: Page, user: TestUser): Promise<void> {
	await page.goto("/login");
	// wait for hydration to settle so Svelte doesn't overwrite the typed value
	// (the form's `value={form?.identifier ?? ""}` reactively re-renders to "")
	await page.waitForLoadState("networkidle");
	await page.locator('input[name="identifier"]').fill(user.username);
	await page.locator('input[name="password"]').fill(user.password);
	await page.getByRole("button", { name: /log in/i }).click();
	await page.waitForURL((url) => url.pathname === "/", { timeout: 10_000 });
}

export async function wsBackendUp(_page?: Page): Promise<boolean> {
	// Probe from Node (the test runner), not from the browser — a fetch from
	// `about:blank` would be cross-origin and get blocked. Any HTTP response
	// from :8080 means chess_server is up (the catch-all returns 404).
	try {
		const ctrl = new AbortController();
		const timer = setTimeout(() => ctrl.abort(), 1500);
		const res = await fetch("http://localhost:8080/__probe__", {
			signal: ctrl.signal,
		});
		clearTimeout(timer);
		return res.status === 404 || res.status < 500;
	} catch {
		return false;
	}
}

export async function startMatchBetween(
	inviter: Page,
	invited: Page,
	invitedUsername: string,
): Promise<void> {
	await inviter.goto("/challenge");
	await inviter
		.locator('input[placeholder="Nombre de usuario…"]')
		.fill(invitedUsername);
	await expect(
		inviter.getByRole("button", { name: /^Retar$/i }).first(),
	).toBeVisible({ timeout: 10_000 });
	await inviter.getByRole("button", { name: /^Retar$/i }).first().click();
	await expect(invited.getByText(/wants to play/i)).toBeVisible({
		timeout: 10_000,
	});
	await invited.getByTitle(/Accept/i).click();
	await Promise.all([
		inviter.waitForURL(/\/game\?mode=human/, { timeout: 10_000 }),
		invited.waitForURL(/\/game\?mode=human/, { timeout: 10_000 }),
	]);
	await Promise.all([
		expect(inviter.locator(".cg-wrap")).toBeVisible({ timeout: 10_000 }),
		expect(invited.locator(".cg-wrap")).toBeVisible({ timeout: 10_000 }),
	]);
}

export async function resignAndGoHome(page: Page): Promise<void> {
	page.once("dialog", (d) => void d.accept());
	await page.getByRole("button", { name: /^Resign$/i }).click();
	const homeBtn = page.getByRole("button", { name: /^Home$/i });
	await expect(homeBtn).toBeVisible({ timeout: 10_000 });
	await homeBtn.click();
	await page.waitForURL("**/", { timeout: 10_000 });
}

export async function leaveGameToHome(page: Page): Promise<void> {
	// the loser/opponent sees the modal too once the WS message arrives
	const homeBtn = page.getByRole("button", { name: /^Home$/i });
	await expect(homeBtn).toBeVisible({ timeout: 10_000 });
	await homeBtn.click();
	await page.waitForURL("**/", { timeout: 10_000 });
}

export async function colorOf(page: Page): Promise<"white" | "black"> {
	// Chessground sets orientation-* class on the `.cg-wrap` container.
	const cls = await page.locator(".cg-wrap").getAttribute("class");
	return cls?.includes("orientation-black") ? "black" : "white";
}

export async function pieceAt(page: Page, key: string): Promise<boolean> {
	return page.evaluate((k) => {
		const pieces = Array.from(
			document.querySelectorAll("piece"),
		) as Array<HTMLElement & { cgKey?: string }>;
		return pieces.some((p) => p.cgKey === k);
	}, key);
}

export async function makeMoveOn(
	page: Page,
	from: string,
	to: string,
): Promise<void> {
	// Compute the center of the `from` and `to` squares from cg-board's bbox.
	// Chessground positions pieces by CSS transform; squares don't always
	// have a stable cgKey at first render. Doing the math ourselves avoids
	// the brittleness of looking up the actual element.
	const rects = await page.evaluate(
		({ from, to }) => {
			const board = document.querySelector("cg-board") as HTMLElement | null;
			const wrap = document.querySelector(".cg-wrap") as HTMLElement | null;
			if (!board) return null;
			const r = board.getBoundingClientRect();
			const orientWhite =
				(wrap?.className.includes("orientation-white") ?? true) === true;
			const fileIdx = (s: string) => s.charCodeAt(0) - "a".charCodeAt(0);
			const rankIdx = (s: string) => Number(s[1]) - 1;
			const center = (sq: string) => {
				const f = fileIdx(sq);
				const rk = rankIdx(sq);
				const col = orientWhite ? f : 7 - f;
				const row = orientWhite ? 7 - rk : rk;
				const sz = r.width / 8;
				return {
					x: r.left + col * sz + sz / 2,
					y: r.top + row * sz + sz / 2,
				};
			};
			return { from: center(from), to: center(to) };
		},
		{ from, to },
	);
	if (!rects) throw new Error(`cg-board not found while moving ${from}->${to}`);
	await page.mouse.move(rects.from.x, rects.from.y);
	await page.mouse.down();
	// Chessground needs the pointer to leave the origin square (drag
	// threshold) before it tracks the drag — nudge a few px first, then
	// jump straight to the destination (no intermediate steps: hovering
	// over many squares in turn can trip Board.svelte's effect loop).
	await page.mouse.move(rects.from.x + 5, rects.from.y + 5);
	await page.mouse.move(rects.to.x, rects.to.y);
	await page.mouse.up();
}

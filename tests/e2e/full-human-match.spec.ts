import { expect, test } from "@playwright/test";
import {
	leaveGameToHome,
	registerUser,
	resignAndGoHome,
	startMatchBetween,
	wsBackendUp,
} from "./_fixtures";

test("two humans can play multiple matches and the home keeps rendering", async ({
	browser,
}) => {
	test.setTimeout(90_000);

	const probe = await browser.newContext();
	const probePage = await probe.newPage();
	const up = await wsBackendUp(probePage);
	await probe.close();
	test.skip(!up, "chess_server not running on :8080");

	const ctxA = await browser.newContext();
	const ctxB = await browser.newContext();
	const pageA = await ctxA.newPage();
	const pageB = await ctxB.newPage();

	try {
		const userA = await registerUser(pageA);
		const userB = await registerUser(pageB);

		// --- First match: A invites B, A resigns. Both navigate home. ---
		await startMatchBetween(pageA, pageB, userB.username);

		await Promise.all([resignAndGoHome(pageA), leaveGameToHome(pageB)]);

		// Sanity: home is alive on both sides after the first game.
		await expect(
			pageA.getByRole("heading", { name: "Neon Chess", exact: true }),
		).toBeVisible();
		await expect(
			pageB.getByRole("heading", { name: "Neon Chess", exact: true }),
		).toBeVisible();

		// --- Second match between the same two users.
		// This is the one that historically blacked out the home
		// (RecentGames duplicate-key crash when two rows share opponent). ---
		await startMatchBetween(pageB, pageA, userA.username);

		await Promise.all([resignAndGoHome(pageB), leaveGameToHome(pageA)]);

		// The real bug check: home renders, not a blank/black page.
		await expect(
			pageA.getByRole("heading", { name: "Neon Chess", exact: true }),
		).toBeVisible();
		await expect(
			pageA.getByRole("link", { name: /Play vs Human/i }),
		).toBeVisible();
		await expect(
			pageB.getByRole("heading", { name: "Neon Chess", exact: true }),
		).toBeVisible();
		await expect(
			pageB.getByRole("link", { name: /Play vs Human/i }),
		).toBeVisible();

		// Belt-and-suspenders: no lingering fluid-bg canvas.
		expect(await pageA.locator("canvas.fixed").count()).toBe(0);
		expect(await pageB.locator("canvas.fixed").count()).toBe(0);
	} finally {
		await ctxA.close();
		await ctxB.close();
	}
});

import { expect, test, type Page } from "@playwright/test";
import { registerUser } from "./_fixtures";

async function wsBackendUp(page: Page): Promise<boolean> {
	await page.goto("about:blank");
	return page.evaluate<boolean>(
		() =>
			new Promise((resolve) => {
				let done = false;
				const finish = (ok: boolean) => {
					if (done) return;
					done = true;
					resolve(ok);
				};
				try {
					const ws = new WebSocket("ws://localhost:8080");
					ws.addEventListener("open", () => {
						ws.close();
						finish(true);
					});
					ws.addEventListener("error", () => finish(false));
					setTimeout(() => finish(false), 1500);
				} catch {
					finish(false);
				}
			}),
	);
}

test("challenge sender is auto-navigated to the game when receiver accepts", async ({
	browser,
}) => {
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

		// A opens challenge page and searches for B
		await pageA.goto("/challenge");
		await pageA
			.locator('input[placeholder="Nombre de usuario…"]')
			.fill(userB.username);
		await expect(
			pageA.getByRole("button", { name: /^Retar$/i }).first(),
		).toBeVisible({ timeout: 10_000 });
		await pageA.getByRole("button", { name: /^Retar$/i }).first().click();

		// B should see the incoming invite toast and accept it
		await expect(
			pageB.getByText(new RegExp(`${userA.username}.*wants to play`, "i")),
		).toBeVisible({ timeout: 10_000 });
		await pageB.getByTitle(/Accept/i).click();

		// A must auto-navigate to the game board
		await pageA.waitForURL(/\/game\?mode=human/, { timeout: 5_000 });
		await expect(pageA.locator(".cg-wrap")).toBeVisible({ timeout: 10_000 });
	} finally {
		await ctxA.close();
		await ctxB.close();
	}
});

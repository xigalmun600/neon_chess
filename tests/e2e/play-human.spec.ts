import { expect, test } from "@playwright/test";
import { registerUser } from "./_fixtures";
import { watchConsole } from "./_console";

async function wsBackendUp(page: import("@playwright/test").Page): Promise<boolean> {
	await page.goto("about:blank");
	return page.evaluate<boolean>(() =>
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

test("starting a game vs human enters the matchmaking queue", async ({ page }) => {
	test.skip(!(await wsBackendUp(page)), "chess_server not running on :8080");

	const watch = watchConsole(page);

	await registerUser(page);
	await page.goto("/game?mode=human");

	await expect(page.getByText(/status:\s*(find|playing|on)/i)).toBeVisible({
		timeout: 15_000,
	});

	await page.waitForTimeout(1_500);
	watch.expectNoErrors();
});

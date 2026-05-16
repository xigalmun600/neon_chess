import { expect, test } from "@playwright/test";
import { registerUser, wsBackendUp } from "./_fixtures";
import { watchConsole } from "./_console";

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

import { expect, test } from "@playwright/test";
import { registerUser } from "./_fixtures";
import { watchConsole } from "./_console";

test("starting a game vs machine mounts the board without console errors", async ({ page }) => {
	const watch = watchConsole(page);

	await registerUser(page);
	await page.goto("/game?mode=machine");

	await expect(page.locator(".cg-wrap")).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText(/playing|on/i)).toBeVisible({ timeout: 15_000 });

	await page.waitForTimeout(2_000);

	watch.expectNoErrors();
});

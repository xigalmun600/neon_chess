import { expect, test } from "@playwright/test";
import { logout, registerUser } from "./_fixtures";

test("login with existing credentials returns to homepage", async ({ page }) => {
	const user = await registerUser(page);
	await logout(page);

	await page.goto("/login");
	await page.locator('input[name="identifier"]').fill(user.username);
	await page.locator('input[name="password"]').fill(user.password);
	await page.getByRole("button", { name: /log in/i }).click();

	await page.waitForURL("**/", { timeout: 10_000 });
	await expect(page.locator("header").getByText(user.username)).toBeVisible();
});

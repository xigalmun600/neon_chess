import { expect, test } from "@playwright/test";
import { loginUser, logout, registerUser } from "./_fixtures";

test("login with existing credentials returns to homepage", async ({ page }) => {
	const user = await registerUser(page);
	await logout(page);
	await loginUser(page, user);
	await expect(page.locator("header").getByText(user.username)).toBeVisible();
});

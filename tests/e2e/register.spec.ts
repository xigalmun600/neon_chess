import { test } from "@playwright/test";
import { registerUser } from "./_fixtures";

test("register creates an account and logs the user in", async ({ page }) => {
	await registerUser(page);
});

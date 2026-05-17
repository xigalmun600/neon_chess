import { expect, test } from "@playwright/test";
import { loginUser, logout, registerUser } from "./_fixtures";

test("login lands on a fully-rendered home without manual reload", async ({
	page,
}) => {
	const user = await registerUser(page);
	await logout(page);

	await loginUser(page, user);

	await expect(page.locator("header").getByText(user.username)).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Neon Chess", exact: true }),
	).toBeVisible();
	await expect(page.getByRole("link", { name: /Jugar contra humano/i })).toBeVisible();
});

test("register lands on a fully-rendered home without manual reload", async ({
	page,
}) => {
	const user = await registerUser(page);

	await expect(page.locator("header").getByText(user.username)).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Neon Chess", exact: true }),
	).toBeVisible();
	await expect(page.getByRole("link", { name: /Jugar contra humano/i })).toBeVisible();
});

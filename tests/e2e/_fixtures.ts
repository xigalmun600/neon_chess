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

export async function registerUser(page: Page): Promise<TestUser> {
	const user = makeUser();
	await page.goto("/register");
	await page.locator('input[name="username"]').fill(user.username);
	await page.locator('input[name="email"]').fill(user.email);
	await page.locator('input[name="password"]').fill(user.password);
	await page.getByRole("button", { name: /register/i }).click();
	await page.waitForURL("**/", { timeout: 10_000 });
	await expect(page.locator("header").getByText(user.username)).toBeVisible();
	return user;
}

export async function logout(page: Page) {
	await page.locator('header form[action="/logout"] button[type="submit"]').click();
	await page.waitForURL("**/", { timeout: 10_000 });
	await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
}

export async function loginUser(page: Page, user: TestUser): Promise<void> {
	await page.goto("/login");
	await page.locator('input[name="identifier"]').fill(user.username);
	await page.locator('input[name="password"]').fill(user.password);
	await page.getByRole("button", { name: /log in/i }).click();
	await page.waitForURL("**/", { timeout: 10_000 });
}

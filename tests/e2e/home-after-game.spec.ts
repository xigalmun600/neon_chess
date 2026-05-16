import { expect, test } from "@playwright/test";
import { registerUser } from "./_fixtures";

test("home stays visible (not black) after finishing a machine game", async ({
	page,
}) => {
	await registerUser(page);

	await page.goto("/game?mode=machine");
	await expect(page.locator(".cg-wrap")).toBeVisible({ timeout: 15_000 });

	// resign uses a native confirm() dialog; accept it automatically
	page.once("dialog", (d) => void d.accept());
	await page.getByRole("button", { name: /^Resign$/i }).click();

	// the game-over modal should appear and offer "Home"
	const homeButton = page.getByRole("button", { name: /^Home$/i });
	await expect(homeButton).toBeVisible({ timeout: 10_000 });
	await homeButton.click();

	await page.waitForURL("**/", { timeout: 10_000 });

	// the home must render real content — if the canvas were covering the
	// page in black, these elements would be hidden behind it
	await expect(
		page.getByRole("heading", { name: "Neon Chess", exact: true }),
	).toBeVisible();
	await expect(page.getByRole("link", { name: /Play vs Human/i })).toBeVisible();
	await expect(page.getByRole("link", { name: /Play vs Machine/i })).toBeVisible();

	// belt and suspenders: any FluidBackground canvas should be gone from
	// the DOM (the cleanup removes it on game-layout unmount)
	const canvases = await page.locator("canvas.fixed").count();
	expect(canvases).toBe(0);
});

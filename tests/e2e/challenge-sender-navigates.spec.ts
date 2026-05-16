import { test } from "@playwright/test";
import { registerUser, startMatchBetween, wsBackendUp } from "./_fixtures";

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
		await registerUser(pageA);
		const userB = await registerUser(pageB);

		// startMatchBetween already asserts that BOTH pages reach /game?mode=human
		// and that the board is visible — that's exactly what the sender bug is.
		await startMatchBetween(pageA, pageB, userB.username);
	} finally {
		await ctxA.close();
		await ctxB.close();
	}
});

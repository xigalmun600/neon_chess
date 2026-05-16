import { expect, test } from "@playwright/test";
import {
	colorOf,
	makeMoveOn,
	registerUser,
	startMatchBetween,
	wsBackendUp,
} from "./_fixtures";

// Count chessground squares tagged as "last move" — a robust proxy for
// "a move has been applied to the board" that doesn't depend on cgKey.
async function lastMoveSquareCount(
	page: import("@playwright/test").Page,
): Promise<number> {
	return page.evaluate(
		() => document.querySelectorAll("square.last-move").length,
	);
}

test("two humans exchange real moves over the WS", async ({ browser }) => {
	test.setTimeout(60_000);

	test.skip(!(await wsBackendUp()), "chess_server not running on :8080");

	const ctxA = await browser.newContext();
	const ctxB = await browser.newContext();
	const pageA = await ctxA.newPage();
	const pageB = await ctxB.newPage();

	try {
		await registerUser(pageA);
		const userB = await registerUser(pageB);

		await startMatchBetween(pageA, pageB, userB.username);

		const colA = await colorOf(pageA);
		const [white, black] = colA === "white" ? [pageA, pageB] : [pageB, pageA];

		const moves: Array<{ side: "white" | "black"; from: string; to: string }> = [
			{ side: "white", from: "e2", to: "e4" },
			{ side: "black", from: "e7", to: "e5" },
			{ side: "white", from: "g1", to: "f3" },
			{ side: "black", from: "b8", to: "c6" },
		];

		for (const m of moves) {
			const mover = m.side === "white" ? white : black;
			const receiver = m.side === "white" ? black : white;
			await makeMoveOn(mover, m.from, m.to);
			// Board.svelte calls `cg.set({fen})` after a local move, which
			// wipes the `last-move` styling on the mover. The receiver runs
			// `cg.move(from, to)` via the WS effect, which preserves it —
			// so the round-trip succeeds only if the receiver sees the move.
			await expect
				.poll(() => lastMoveSquareCount(receiver), {
					timeout: 5_000,
					message: `receiver should see last-move squares after ${m.from}-${m.to}`,
				})
				.toBeGreaterThan(0);
		}
	} finally {
		await ctxA.close();
		await ctxB.close();
	}
});

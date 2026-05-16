import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "tests/e2e",
	fullyParallel: false,
	workers: 1,
	timeout: 30_000,
	reporter: "list",
	use: {
		baseURL: "http://localhost:5173",
		headless: true,
		trace: "retain-on-failure",
	},
	webServer: {
		command: "npm run dev",
		url: "http://localhost:5173",
		reuseExistingServer: true,
		timeout: 60_000,
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				// big viewport so the chess board fits without scrolling —
				// chessground drag math is in viewport-relative coords.
				viewport: { width: 1600, height: 1200 },
			},
		},
	],
});

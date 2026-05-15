import { expect, type Page } from "@playwright/test";

export type ConsoleWatch = {
	errors: string[];
	expectNoErrors: () => void;
};

export function watchConsole(page: Page): ConsoleWatch {
	const errors: string[] = [];

	page.on("pageerror", (err) => {
		errors.push(`pageerror: ${err.message}`);
	});

	page.on("console", (msg) => {
		if (msg.type() === "error") {
			errors.push(`console.error: ${msg.text()}`);
		}
	});

	return {
		errors,
		expectNoErrors() {
			expect(errors, `unexpected browser errors:\n${errors.join("\n")}`).toEqual([]);
		},
	};
}

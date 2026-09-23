import { expect, test } from "@playwright/test";

test.describe("Declaration reflow at 320px", () => {
	test.use({ viewport: { width: 320, height: 256 } });

	for (const path of [
		"/declaration-remuneration/etape/6",
		"/declaration-remuneration/parcours-conformite/etape/3",
	]) {
		test(`${path} has no horizontal overflow`, async ({ page }) => {
			await page.goto(path, { waitUntil: "domcontentloaded" });
			await expect
				.poll(() =>
					page.evaluate(
						() => document.documentElement.scrollWidth <= window.innerWidth,
					),
				)
				.toBe(true);
		});
	}
});

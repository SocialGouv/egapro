import { expect, test } from "@playwright/test";

// K1/K7 tiles, chart and table are covered by src/modules/publicStats/__tests__/*.

test.describe("public stats", () => {
	test("an anonymous visitor can reach /stats without being redirected to /login", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({
			storageState: { cookies: [], origins: [] },
		});
		try {
			const page = await anonCtx.newPage();
			await page.goto("/stats");
			await expect(page).not.toHaveURL(/\/login/);
			await expect(
				page.getByRole("heading", {
					name: "Statistiques publiques",
					level: 1,
				}),
			).toBeVisible();
		} finally {
			await anonCtx.close();
		}
	});
});

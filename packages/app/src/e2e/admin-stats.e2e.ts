import { expect, test } from "@playwright/test";

// Dashboard rendering is covered by src/modules/admin/stats/__tests__/*.

test.describe("admin stats — routing & access", () => {
	test("redirect: /admin/stats/campagne → /admin/stats", async ({ page }) => {
		await page.goto("/admin/stats/campagne");
		await expect(page).toHaveURL(/\/admin\/stats$/);
	});

	test("redirect: /admin/stats/plateforme → /admin/stats", async ({ page }) => {
		await page.goto("/admin/stats/plateforme");
		await expect(page).toHaveURL(/\/admin\/stats$/);
	});

	test("non-admin users are redirected away from the stats page", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			await page.goto("/admin/stats");
			await expect(page).toHaveURL(/\/login/);
		} finally {
			await anonCtx.close();
		}
	});
});

import { expect, test } from "@playwright/test";
import { urlPattern } from "~/e2e/helpers/routes";
import {
	ADMIN_STATS,
	ADMIN_STATS_CAMPAIGN,
	ADMIN_STATS_PLATFORM,
} from "~/modules/routes";

// Dashboard rendering is covered by src/modules/admin/stats/__tests__/*.

test.describe("admin stats — routing & access", () => {
	test("redirect: /admin/stats/campagne → /admin/stats", async ({ page }) => {
		await page.goto(ADMIN_STATS_CAMPAIGN);
		await expect(page).toHaveURL(urlPattern(ADMIN_STATS));
	});

	test("redirect: /admin/stats/plateforme → /admin/stats", async ({ page }) => {
		await page.goto(ADMIN_STATS_PLATFORM);
		await expect(page).toHaveURL(urlPattern(ADMIN_STATS));
	});

	test("non-admin users are redirected away from the stats page", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const page = await anonCtx.newPage();
			await page.goto(ADMIN_STATS);
			await expect(page).toHaveURL(/\/login/);
		} finally {
			await anonCtx.close();
		}
	});
});

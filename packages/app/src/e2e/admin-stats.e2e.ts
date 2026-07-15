import { expect, test } from "@playwright/test";

// The stats dashboard rendering — KPI tiles, campaign progression chart/table,
// step durations, step dropoff, completion funnels, filters and accessible
// tables — is covered by unit tests in src/modules/admin/stats/__tests__/*
// (StatsDashboard, StatsDashboard.campaign, and one test per chart/table/tile),
// and the aggregation + admin-only access control by the adminStats router test
// (src/server/api/routers/__tests__/adminStats.test.ts). Only the route-level
// canonical redirects and the page authz guard remain end-to-end.

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

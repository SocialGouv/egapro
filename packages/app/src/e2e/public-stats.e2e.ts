import { expect, test } from "@playwright/test";

// Only the anonymous-access invariant is exercised end-to-end here. The K1
// declaration-rate tile, the K7 score-distribution chart and its accessible
// table are covered by unit tests in src/modules/publicStats/__tests__/*
// (CurrentCampaignRateTile, PublicKpiTile, ScoreDistributionChart,
// ScoreDistributionTable), and the underlying aggregation by the
// publicStats router test (src/server/api/routers/__tests__/publicStats.test.ts).

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

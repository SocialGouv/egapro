import { expect, test } from "@playwright/test";

import { getCurrentYear } from "~/modules/domain";
import {
	deleteSeededCampaignDeclarations,
	seedGipMdsObligatedPopulation,
	seedSubmittedDeclarationsForStats,
} from "./helpers/db-campaign";

const PUBLIC_K1_SIRENS = {
	obligatedSubmitted: "999300201",
	obligatedNotSubmitted: "999300202",
	obligatedPrevYearSubmitted: "999300203",
	obligatedPrevYearNotSubmitted: "999300204",
} as const;

test.describe("public stats — K1 declaration rate tile", () => {
	const currentYear = getCurrentYear();

	test.beforeAll(async () => {
		await seedGipMdsObligatedPopulation([
			{
				siren: PUBLIC_K1_SIRENS.obligatedSubmitted,
				year: currentYear,
				workforceEma: 250,
			},
			{
				siren: PUBLIC_K1_SIRENS.obligatedNotSubmitted,
				year: currentYear,
				workforceEma: 250,
			},
			{
				siren: PUBLIC_K1_SIRENS.obligatedPrevYearSubmitted,
				year: currentYear - 1,
				workforceEma: 250,
			},
			{
				siren: PUBLIC_K1_SIRENS.obligatedPrevYearNotSubmitted,
				year: currentYear - 1,
				workforceEma: 250,
			},
		]);
		await seedSubmittedDeclarationsForStats([
			{
				siren: PUBLIC_K1_SIRENS.obligatedSubmitted,
				year: currentYear,
				submittedAt: `${currentYear}-02-10T10:00:00Z`,
				workforce: 250,
			},
			{
				siren: PUBLIC_K1_SIRENS.obligatedPrevYearSubmitted,
				year: currentYear - 1,
				submittedAt: `${currentYear - 1}-02-10T10:00:00Z`,
				workforce: 250,
			},
		]);
	});

	test.afterAll(async () => {
		await deleteSeededCampaignDeclarations(Object.values(PUBLIC_K1_SIRENS));
	});

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

	test("public K1 tile is rendered with the current-year title and a percent value", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({
			storageState: { cookies: [], origins: [] },
		});
		try {
			const page = await anonCtx.newPage();
			await page.goto("/stats");

			await expect(
				page.getByRole("heading", {
					name: new RegExp(`^Taux de déclaration ${currentYear}$`),
				}),
			).toBeVisible();
			await expect(page.getByText(/\d{1,3},\d\s*%/)).toBeVisible();
			await expect(
				page.getByText(/\d+\s*\/\s*\d+\s+entreprises/),
			).toBeVisible();
		} finally {
			await anonCtx.close();
		}
	});
});

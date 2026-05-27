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
	scoreHigh: "999300205",
	scoreLow: "999300206",
	scoreNc: "999300207",
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
				remunerationScore: 35,
				quartileScore: 15,
				categoryScore: 40,
			},
			{
				siren: PUBLIC_K1_SIRENS.obligatedPrevYearSubmitted,
				year: currentYear - 1,
				submittedAt: `${currentYear - 1}-02-10T10:00:00Z`,
				workforce: 250,
			},
			{
				siren: PUBLIC_K1_SIRENS.scoreHigh,
				year: currentYear,
				submittedAt: `${currentYear}-02-11T10:00:00Z`,
				workforce: 200,
				remunerationScore: 40,
				quartileScore: 15,
				categoryScore: 30,
			},
			{
				siren: PUBLIC_K1_SIRENS.scoreLow,
				year: currentYear,
				submittedAt: `${currentYear}-02-12T10:00:00Z`,
				workforce: 200,
				remunerationScore: 10,
				quartileScore: 5,
				categoryScore: 20,
			},
			{
				siren: PUBLIC_K1_SIRENS.scoreNc,
				year: currentYear,
				submittedAt: `${currentYear}-02-13T10:00:00Z`,
				workforce: 200,
				remunerationScore: null,
				quartileScore: null,
				categoryScore: null,
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
			await expect(page.getByText(/\d{1,3},\d\s*%/).first()).toBeVisible();
			await expect(
				page.getByText(/\d+\s*\/\s*\d+\s+entreprises/),
			).toBeVisible();
		} finally {
			await anonCtx.close();
		}
	});

	test("public K7 score distribution renders a bar chart and the accessible table", async ({
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
					level: 2,
					name: new RegExp(`^Distribution des scores ${currentYear}$`),
				}),
			).toBeVisible();
			const bars = page.locator(".recharts-bar-rectangle");
			await expect(bars.first()).toBeVisible();
			const distributionTable = page.getByRole("table", {
				name: /nombre d'entreprises par tranche de score global/i,
			});
			await expect(distributionTable).toBeVisible();
			await expect(
				distributionTable.getByRole("rowheader", { name: "NC" }),
			).toBeVisible();
			await expect(
				distributionTable.getByRole("rowheader", { name: "100" }),
			).toBeVisible();
		} finally {
			await anonCtx.close();
		}
	});
});

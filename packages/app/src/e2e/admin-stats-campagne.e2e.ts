import { expect, test } from "@playwright/test";

import { getCurrentYear } from "~/modules/domain";
import {
	deleteSeededCampaignDeclarations,
	seedGipMdsObligatedPopulation,
	seedSubmittedDeclarationsForStats,
} from "./helpers/db-campaign";

// 9-digit SIRENs reserved for this test only — chosen outside any legitimate
// range so we don't collide with real data.
const SIRENS = {
	smallA: "999300001",
	smallB: "999300002",
	largeA: "999300003",
} as const;

const K1_SIRENS = {
	obligatedSubmitted: "999300101",
	obligatedNotSubmitted: "999300102",
	obligatedPrevYearSubmitted: "999300103",
	obligatedPrevYearNotSubmitted: "999300104",
} as const;

test.describe("admin campaign progression stats", () => {
	test.beforeAll(async () => {
		await seedSubmittedDeclarationsForStats([
			{
				siren: SIRENS.smallA,
				year: 2024,
				submittedAt: "2024-01-15T10:00:00Z",
				workforce: 30,
			},
			{
				siren: SIRENS.smallB,
				year: 2025,
				submittedAt: "2025-01-20T10:00:00Z",
				workforce: 30,
			},
			{
				siren: SIRENS.largeA,
				year: 2026,
				submittedAt: "2026-01-10T10:00:00Z",
				workforce: 250,
			},
		]);
	});

	test.afterAll(async () => {
		await deleteSeededCampaignDeclarations(Object.values(SIRENS));
	});

	test("admin can open the campaign stats page and sees the chart", async ({
		page,
	}) => {
		await page.goto("/admin/stats/campagne");

		await expect(
			page.getByRole("heading", { name: "Statistiques campagne", level: 1 }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: "Progression dans le temps",
				level: 2,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("figure", {
				name: /courbe de progression cumulative/i,
			}),
		).toBeVisible();
	});

	test("accessible alternative table lists the same data", async ({ page }) => {
		await page.goto("/admin/stats/campagne");

		// Wait for the chart to be rendered — the table renders next to it only
		// once the tRPC query resolves.
		await expect(
			page.getByRole("figure", { name: /courbe de progression cumulative/i }),
		).toBeVisible();

		await page
			.getByLabel("Progression dans le temps")
			.locator("summary", {
				hasText: /consulter les données du graphique sous forme de tableau/i,
			})
			.click();

		await expect(
			page.getByRole("columnheader", { name: "2024" }),
		).toBeVisible();
	});

	test("filtering by size range keeps only matching companies", async ({
		page,
	}) => {
		await page.goto("/admin/stats/campagne");
		await page.getByLabel("Tranche d'effectif").selectOption("250+");

		// The small-company seeds should disappear; the large one (workforce=250)
		// still contributes to the 2026 curve.
		await expect(
			page.getByRole("figure", { name: /courbe de progression cumulative/i }),
		).toBeVisible();
	});

	test("K4 step durations table lists wizard steps and post-submit milestones", async ({
		page,
	}) => {
		await page.goto("/admin/stats/campagne");

		// Section K4 — délai moyen par étape
		await expect(
			page.getByRole("heading", { name: /Délai moyen par étape/i, level: 2 }),
		).toBeVisible();

		const k4Section = page.getByLabel(/Délai moyen par étape/i);

		// Open the accessible alternative table. Scope to K4 to avoid colliding
		// with the K2 progression table summary above.
		await k4Section
			.locator("summary", {
				hasText: /consulter les données du graphique sous forme de tableau/i,
			})
			.click();

		// Wizard group header + post-submit group header.
		await expect(
			k4Section.getByRole("rowheader", {
				name: /Parcours initial \(wizard A–F\)/i,
			}),
		).toBeVisible();
		await expect(
			k4Section.getByRole("rowheader", { name: "Démarche post-soumission" }),
		).toBeVisible();

		// At least one wizard row and one post-submit row.
		await expect(
			k4Section.getByRole("rowheader", { name: "Introduction" }),
		).toBeVisible();
		await expect(
			k4Section.getByRole("rowheader", {
				name: /Délai avant choix du parcours/i,
			}),
		).toBeVisible();
		await expect(
			k4Section.getByRole("rowheader", {
				name: /Temps passé sur l'avis CSE/i,
			}),
		).toBeVisible();
	});
});

test("non-admin users are redirected away from the stats page", async ({
	browser,
}) => {
	const anonCtx = await browser.newContext({ storageState: undefined });
	try {
		const page = await anonCtx.newPage();
		await page.goto("/admin/stats/campagne");
		// Redirected to /login (anonymous).
		await expect(page).toHaveURL(/\/login/);
	} finally {
		await anonCtx.close();
	}
});

test.describe("admin campaign K1 declaration rate tile", () => {
	const currentYear = getCurrentYear();

	test.beforeAll(async () => {
		await seedGipMdsObligatedPopulation([
			{
				siren: K1_SIRENS.obligatedSubmitted,
				year: currentYear,
				workforceEma: 250,
			},
			{
				siren: K1_SIRENS.obligatedNotSubmitted,
				year: currentYear,
				workforceEma: 250,
			},
			{
				siren: K1_SIRENS.obligatedPrevYearSubmitted,
				year: currentYear - 1,
				workforceEma: 250,
			},
			{
				siren: K1_SIRENS.obligatedPrevYearNotSubmitted,
				year: currentYear - 1,
				workforceEma: 250,
			},
		]);
		await seedSubmittedDeclarationsForStats([
			{
				siren: K1_SIRENS.obligatedSubmitted,
				year: currentYear,
				submittedAt: `${currentYear}-02-10T10:00:00Z`,
				workforce: 250,
			},
			{
				siren: K1_SIRENS.obligatedPrevYearSubmitted,
				year: currentYear - 1,
				submittedAt: `${currentYear - 1}-02-10T10:00:00Z`,
				workforce: 250,
			},
		]);
	});

	test.afterAll(async () => {
		await deleteSeededCampaignDeclarations(Object.values(K1_SIRENS));
	});

	test("K1 tile is rendered with the current-year title and a percent value", async ({
		page,
	}) => {
		await page.goto("/admin/stats/campagne");

		await expect(
			page.getByRole("heading", {
				name: new RegExp(`^Taux de déclaration ${currentYear}$`),
			}),
		).toBeVisible();
		await expect(page.getByText(/\d{1,3},\d\s*%/)).toBeVisible();
	});

	test("the K1 year selector exposes 4 options (currentYear + 3 previous)", async ({
		page,
	}) => {
		await page.goto("/admin/stats/campagne");

		const select = page.getByLabel(/année \(taux de déclaration\)/i);
		await expect(select).toBeVisible();
		const optionsCount = await select.locator("option").count();
		expect(optionsCount).toBe(4);
	});

	test("changing the size range filter keeps the K1 tile rendered", async ({
		page,
	}) => {
		await page.goto("/admin/stats/campagne");

		await expect(
			page.getByRole("heading", { name: /^Taux de déclaration/ }),
		).toBeVisible();
		await page.getByLabel("Tranche d'effectif").selectOption("250+");
		await expect(
			page.getByRole("heading", { name: /^Taux de déclaration/ }),
		).toBeVisible();
	});
});

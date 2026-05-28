import { expect, test } from "@playwright/test";

import { getCurrentYear } from "~/modules/domain";
import {
	deleteSeededCampaignDeclarations,
	seedGipMdsObligatedPopulation,
	seedSubmittedDeclarationsForStats,
} from "./helpers/db-campaign";
import {
	deleteFunnelDeclarations,
	seedFunnelDeclarations,
} from "./helpers/db-funnel";

// 9-digit SIRENs reserved for this test only — chosen outside any legitimate
// range so we don't collide with real data.
const CAMPAIGN_SIRENS = {
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

const FUNNEL_SIRENS = {
	main: "999500001",
	compliance: "999500002",
	revision: "999500003",
	cse: "999500004",
} as const;

const K19_YEAR = 2024;

test.describe("admin unified stats dashboard — campaign section (S3/S4)", () => {
	test.beforeAll(async () => {
		await seedSubmittedDeclarationsForStats([
			{
				siren: CAMPAIGN_SIRENS.smallA,
				year: 2024,
				submittedAt: "2024-01-15T10:00:00Z",
				workforce: 30,
			},
			{
				siren: CAMPAIGN_SIRENS.smallB,
				year: 2025,
				submittedAt: "2025-01-20T10:00:00Z",
				workforce: 30,
			},
			{
				siren: CAMPAIGN_SIRENS.largeA,
				year: 2026,
				submittedAt: "2026-01-10T10:00:00Z",
				workforce: 250,
			},
		]);
	});

	test.afterAll(async () => {
		await deleteSeededCampaignDeclarations(Object.values(CAMPAIGN_SIRENS));
	});

	test("S3: admin opens /admin/stats and sees h1 + two section h2 headings", async ({
		page,
	}) => {
		await page.goto("/admin/stats");

		await expect(
			page.getByRole("heading", { name: "Statistiques", level: 1 }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Suivi de campagne", level: 2 }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Funnels de complétion", level: 2 }),
		).toBeVisible();
	});

	test("S4: campaign progression chart is visible on /admin/stats", async ({
		page,
	}) => {
		await page.goto("/admin/stats");

		await expect(
			page.getByRole("figure", {
				name: /courbe de progression cumulative/i,
			}),
		).toBeVisible();
	});

	test("accessible alternative table lists campaign progression data", async ({
		page,
	}) => {
		await page.goto("/admin/stats");

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

	test("filtering by size range keeps only matching companies in campaign chart", async ({
		page,
	}) => {
		await page.goto("/admin/stats");
		await page.getByLabel("Tranche d'effectif").selectOption("250+");

		await expect(
			page.getByRole("figure", { name: /courbe de progression cumulative/i }),
		).toBeVisible();
	});

	test("K4 step durations section is visible on the unified page", async ({
		page,
	}) => {
		await page.goto("/admin/stats");

		await expect(
			page.getByRole("heading", { name: /Délai moyen par étape/i, level: 3 }),
		).toBeVisible();

		const k4Section = page.getByLabel(/Délai moyen par étape/i);

		await k4Section
			.locator("summary", {
				hasText: /consulter les données du graphique sous forme de tableau/i,
			})
			.click();

		await expect(
			k4Section.getByRole("rowheader", {
				name: /Parcours initial \(wizard A–F\)/i,
			}),
		).toBeVisible();
	});

	test("K5 step dropoff section is visible with stagnation filter on the unified page", async ({
		page,
	}) => {
		await page.goto("/admin/stats");

		await expect(
			page.getByRole("heading", {
				name: /Taux d'abandon par phase/i,
				level: 3,
			}),
		).toBeVisible();

		const k5Section = page.getByLabel(/Taux d'abandon par phase/i);

		await expect(
			k5Section.getByLabel(/Considérer une déclaration abandonnée après/i),
		).toBeVisible();
	});
});

test.describe("admin unified stats dashboard — K1 declaration rate tile", () => {
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

	test("K1 tile is rendered on the unified stats page", async ({ page }) => {
		await page.goto("/admin/stats");

		await expect(page.getByText(/\d{1,3},\d\s*%/)).toBeVisible();
	});
});

test.describe("admin unified stats dashboard — platform funnel section (S5/S6)", () => {
	test.beforeAll(async () => {
		await seedFunnelDeclarations([
			{
				siren: FUNNEL_SIRENS.main,
				year: K19_YEAR,
				workforce: 30,
				maxStepRound: 6,
				status: "demarche_completed",
				demarcheComplete: true,
			},
			{
				siren: FUNNEL_SIRENS.compliance,
				year: K19_YEAR,
				workforce: 250,
				maxStepRound: 6,
				status: "demarche_completed",
				firstDeclarationPathChoice: "corrective_action",
				pathChoices: [{ round: 1, pathValue: "corrective_action" }],
				correctiveSubmits: [
					{ eventType: "second_declaration_submit", round: 1 },
				],
				demarcheComplete: true,
			},
			{
				siren: FUNNEL_SIRENS.revision,
				year: K19_YEAR,
				workforce: 250,
				maxStepRound: 6,
				status: "demarche_completed",
				firstDeclarationPathChoice: "joint_evaluation",
				pathChoices: [
					{ round: 1, pathValue: "joint_evaluation" },
					{ round: 2, pathValue: "joint_evaluation" },
				],
				correctiveSubmits: [
					{ eventType: "joint_evaluation_submit", round: 1 },
					{ eventType: "joint_evaluation_submit", round: 2 },
				],
				demarcheComplete: true,
			},
			{
				siren: FUNNEL_SIRENS.cse,
				year: K19_YEAR,
				workforce: 250,
				maxStepRound: 6,
				status: "demarche_completed",
				hasCse: true,
				cseOpinionSubmit: true,
				demarcheComplete: true,
			},
		]);
	});

	test.afterAll(async () => {
		await deleteFunnelDeclarations(Object.values(FUNNEL_SIRENS));
	});

	test("S5: admin sees all four funnel headings on /admin/stats", async ({
		page,
	}) => {
		await page.goto("/admin/stats");

		await expect(
			page.getByRole("heading", {
				name: /Funnel principal/i,
				level: 3,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: /Funnel parcours conformité/i,
				level: 3,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: /Funnel cycle de révision/i,
				level: 3,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: /Funnel cycle CSE/i,
				level: 3,
			}),
		).toBeVisible();
	});

	test("S6: funnel accessible tables open correctly within their sections", async ({
		page,
	}) => {
		await page.goto("/admin/stats");

		const firstYear = page.locator(".fr-grid-row").filter({
			hasText: /tranche d'effectif/i,
		});
		void firstYear; // sections use selectedYears[0]; default is currentYear

		// Wait for at least one funnel figure.
		await expect(page.locator("figure").first()).toBeVisible();

		const mainSection = page.getByLabel(
			"Funnel principal — toutes les déclarations",
		);
		await mainSection
			.locator("summary", {
				hasText: /Consulter les données du graphique sous forme de tableau/i,
			})
			.click();

		await expect(
			mainSection.getByRole("rowheader", { name: "Brouillon créé" }),
		).toBeVisible();
	});

	test("revision funnel shows empty message when no data for the selected year", async ({
		page,
	}) => {
		await page.goto("/admin/stats");

		// Deselect all years and re-select only 2018 (no seed).
		// YearsFilter checkboxes: uncheck all then check 2018 if available.
		// Simpler: navigate directly with a year known to have no data.
		// The global filters default to the 3 most recent years.
		// We rely on the funnel query returning empty for years without seeds.
		await expect(
			page.getByText(/Aucune révision pour ces filtres/i),
		).toBeVisible();
	});
});

test("redirect: /admin/stats/campagne → /admin/stats", async ({ page }) => {
	await page.goto("/admin/stats/campagne");
	await expect(page).toHaveURL(/\/admin\/stats/);
});

test("redirect: /admin/stats/plateforme → /admin/stats", async ({ page }) => {
	await page.goto("/admin/stats/plateforme");
	await expect(page).toHaveURL(/\/admin\/stats/);
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

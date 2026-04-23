import { expect, test } from "@playwright/test";

import { getCurrentYear } from "~/modules/domain";

import {
	deleteSeededCampaignDeclarations,
	seedSubmittedDeclarationsForStats,
} from "./helpers/db";

// Reserved SIRENs — outside any real range, scoped to the K8/K10 conformity
// test. averageGap values double as K10 fixture data.
const SIRENS = {
	currentAlert: "999400001", // year N, alert, small
	currentSafe: "999400002", // year N, no alert, small
	currentLargeAlert: "999400003", // year N, alert, large
	currentFinance: "999400004", // year N, alert, NAF K
	previousAlert: "999400005", // year N-1, alert
	previousSafe: "999400006", // year N-1, no alert
} as const;

const CURRENT_YEAR = getCurrentYear();
const PREVIOUS_YEAR = CURRENT_YEAR - 1;

// Seed shared by every test in this file — K8 (gap alert rate) and K10
// (multi-year trend) both consult the same /admin/stats/conformite page,
// so file-level beforeAll/afterAll avoids re-seeding between describes
// and prevents the K10 tests from running against an empty DB.
test.beforeAll(async () => {
	await seedSubmittedDeclarationsForStats([
		{
			siren: SIRENS.currentAlert,
			year: CURRENT_YEAR,
			submittedAt: `${CURRENT_YEAR}-01-15T10:00:00Z`,
			workforce: 30,
			hasAlertGap: true,
			nafCode: "A01.11Z",
			averageGap: 6.5,
		},
		{
			siren: SIRENS.currentSafe,
			year: CURRENT_YEAR,
			submittedAt: `${CURRENT_YEAR}-01-16T10:00:00Z`,
			workforce: 30,
			hasAlertGap: false,
			nafCode: "A01.11Z",
			averageGap: 2.1,
		},
		{
			siren: SIRENS.currentLargeAlert,
			year: CURRENT_YEAR,
			submittedAt: `${CURRENT_YEAR}-01-17T10:00:00Z`,
			workforce: 300,
			hasAlertGap: true,
			nafCode: "C10.11Z",
			averageGap: 7.2,
		},
		{
			siren: SIRENS.currentFinance,
			year: CURRENT_YEAR,
			submittedAt: `${CURRENT_YEAR}-01-18T10:00:00Z`,
			workforce: 50,
			hasAlertGap: true,
			nafCode: "K64.19Z",
			averageGap: 8.4,
		},
		{
			siren: SIRENS.previousAlert,
			year: PREVIOUS_YEAR,
			submittedAt: `${PREVIOUS_YEAR}-02-15T10:00:00Z`,
			workforce: 30,
			hasAlertGap: true,
			nafCode: "A01.11Z",
			averageGap: 6.8,
		},
		{
			siren: SIRENS.previousSafe,
			year: PREVIOUS_YEAR,
			submittedAt: `${PREVIOUS_YEAR}-02-16T10:00:00Z`,
			workforce: 30,
			hasAlertGap: false,
			nafCode: "A01.11Z",
			averageGap: 2.3,
		},
	]);
});

test.afterAll(async () => {
	await deleteSeededCampaignDeclarations(Object.values(SIRENS));
});

test.describe("admin conformity stats (K8 — gap alert rate)", () => {
	test("admin can open the conformity stats page and sees the KPI tile", async ({
		page,
	}) => {
		await page.goto("/admin/stats/conformite");

		await expect(
			page.getByRole("heading", { name: "Statistiques conformité", level: 1 }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: "Taux d'écart ≥ 5 %",
				level: 2,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: new RegExp(`Taux d'écart ≥ 5 % en ${CURRENT_YEAR}`),
				level: 3,
			}),
		).toBeVisible();
	});

	test("filtering by company size updates the tile (fewer declarations)", async ({
		page,
	}) => {
		await page.goto("/admin/stats/conformite");

		// Wait for the first tile render so we know the query resolved.
		await expect(
			page.getByRole("heading", {
				name: new RegExp(`Taux d'écart ≥ 5 % en ${CURRENT_YEAR}`),
				level: 3,
			}),
		).toBeVisible();

		await page.getByLabel("Tranche d'effectif").selectOption("250+");

		// With the "250+" filter, only currentLargeAlert contributes. The tile
		// stays mounted and the subtitle reflects the narrower sample.
		await expect(page.getByText(/Sur 1 déclarations?/)).toBeVisible();
	});

	test("filtering by NAF sector updates the tile (finance only)", async ({
		page,
	}) => {
		await page.goto("/admin/stats/conformite");
		await expect(
			page.getByRole("heading", {
				name: new RegExp(`Taux d'écart ≥ 5 % en ${CURRENT_YEAR}`),
				level: 3,
			}),
		).toBeVisible();

		await page.getByLabel("Filtrer par secteur NAF").selectOption("K");

		await expect(page.getByText(/Sur 1 déclarations?/)).toBeVisible();
	});

	test("switching the year keeps the tile mounted with the new label", async ({
		page,
	}) => {
		await page.goto("/admin/stats/conformite");
		await expect(
			page.getByRole("heading", {
				name: new RegExp(`Taux d'écart ≥ 5 % en ${CURRENT_YEAR}`),
				level: 3,
			}),
		).toBeVisible();

		await page.getByLabel("Année").selectOption(String(PREVIOUS_YEAR));

		await expect(
			page.getByRole("heading", {
				name: new RegExp(`Taux d'écart ≥ 5 % en ${PREVIOUS_YEAR}`),
				level: 3,
			}),
		).toBeVisible();
	});
});

test.describe("admin conformity stats (K10 — multi-year gap trend)", () => {
	test("admin sees the trend section, chart figure and toggle legend", async ({
		page,
	}) => {
		await page.goto("/admin/stats/conformite");

		await expect(
			page.getByRole("heading", {
				name: "Évolution annuelle des écarts",
				level: 2,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("figure", {
				name: /courbe d'évolution annuelle de l'écart moyen/i,
			}),
		).toBeVisible();
	});

	test("switching to workforce segmentation swaps the legend series", async ({
		page,
	}) => {
		await page.goto("/admin/stats/conformite");

		await expect(
			page.getByRole("heading", {
				name: "Évolution annuelle des écarts",
				level: 2,
			}),
		).toBeVisible();

		await page.getByLabel("Segmenter par").selectOption("workforce");

		// Checkbox group appears when there is more than one series.
		await expect(
			page.getByRole("group", { name: /séries affichées/i }),
		).toBeVisible();
	});

	test("a checkbox in the toggle legend hides its series from the chart", async ({
		page,
	}) => {
		await page.goto("/admin/stats/conformite");
		await page.getByLabel("Segmenter par").selectOption("workforce");
		const legend = page.getByRole("group", { name: /séries affichées/i });
		await expect(legend).toBeVisible();

		// DSFR checkbox groups hide the underlying <input> (opacity 0, positioned
		// off-screen) and route clicks through the <label>. Targeting the input
		// directly with .uncheck() times out because Playwright can't "see" it.
		// Click the label text — that dispatches the change event the React
		// controlled checkbox needs, and the input state flips as expected.
		const firstCheckbox = legend.getByRole("checkbox").first();
		const firstLabel = legend.locator("label").first();
		await expect(firstCheckbox).toBeChecked();
		await firstLabel.click();
		await expect(firstCheckbox).not.toBeChecked();
	});

	test("accessible alternative table lists segments and years", async ({
		page,
	}) => {
		await page.goto("/admin/stats/conformite");

		await expect(
			page.getByRole("figure", {
				name: /courbe d'évolution annuelle de l'écart moyen/i,
			}),
		).toBeVisible();

		// The trend section uses the same <details> pattern as K2 — open the
		// second disclosure on the page (the first belongs to the K8 tile if
		// any ever lands; here K8 has no table, so the first details is K10).
		await page
			.locator("summary", {
				hasText: /consulter les données du graphique sous forme de tableau/i,
			})
			.first()
			.click();

		await expect(
			page.getByRole("columnheader", { name: String(CURRENT_YEAR) }),
		).toBeVisible();
	});
});

test("non-admin users are redirected away from the conformity stats page", async ({
	browser,
}) => {
	const anonCtx = await browser.newContext({ storageState: undefined });
	try {
		const page = await anonCtx.newPage();
		await page.goto("/admin/stats/conformite");
		await expect(page).toHaveURL(/\/login/);
	} finally {
		await anonCtx.close();
	}
});

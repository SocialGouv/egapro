import { expect, test } from "@playwright/test";

import { getCurrentYear } from "~/modules/domain";

import {
	deleteSeededCampaignDeclarations,
	seedSubmittedDeclarationsForStats,
} from "./helpers/db";

// Reserved SIRENs — outside any real range, scoped to the K8 conformity test.
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

test.describe("admin conformity stats (K8 — gap alert rate)", () => {
	test.beforeAll(async () => {
		await seedSubmittedDeclarationsForStats([
			{
				siren: SIRENS.currentAlert,
				year: CURRENT_YEAR,
				submittedAt: `${CURRENT_YEAR}-01-15T10:00:00Z`,
				workforce: 30,
				hasAlertGap: true,
				nafCode: "A01.11Z",
			},
			{
				siren: SIRENS.currentSafe,
				year: CURRENT_YEAR,
				submittedAt: `${CURRENT_YEAR}-01-16T10:00:00Z`,
				workforce: 30,
				hasAlertGap: false,
				nafCode: "A01.11Z",
			},
			{
				siren: SIRENS.currentLargeAlert,
				year: CURRENT_YEAR,
				submittedAt: `${CURRENT_YEAR}-01-17T10:00:00Z`,
				workforce: 300,
				hasAlertGap: true,
				nafCode: "C10.11Z",
			},
			{
				siren: SIRENS.currentFinance,
				year: CURRENT_YEAR,
				submittedAt: `${CURRENT_YEAR}-01-18T10:00:00Z`,
				workforce: 50,
				hasAlertGap: true,
				nafCode: "K64.19Z",
			},
			{
				siren: SIRENS.previousAlert,
				year: PREVIOUS_YEAR,
				submittedAt: `${PREVIOUS_YEAR}-02-15T10:00:00Z`,
				workforce: 30,
				hasAlertGap: true,
				nafCode: "A01.11Z",
			},
			{
				siren: SIRENS.previousSafe,
				year: PREVIOUS_YEAR,
				submittedAt: `${PREVIOUS_YEAR}-02-16T10:00:00Z`,
				workforce: 30,
				hasAlertGap: false,
				nafCode: "A01.11Z",
			},
		]);
	});

	test.afterAll(async () => {
		await deleteSeededCampaignDeclarations(Object.values(SIRENS));
	});

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

import { expect, test } from "@playwright/test";
import { urlGlob } from "~/e2e/helpers/routes";
import { remunerationStepHref } from "~/modules/routes";
import { buildGrid, pickCoordinate } from "./grille/coordinates";
import { FICHE_SCENARIOS } from "./grille/scenarios";
import { withCampaignYear } from "./helpers/campaign-year";

/**
 * Indicator G gated by the campaign year (#4022 / #4067).
 *
 * Whether the funnel carries the categories step (step 5 / indicator G) is decided
 * by isIndicatorGRequired(workforce, year): below 250 it only applies on the
 * triennial cadence (base 2027), and — from 2030 — down to every mandatory 50+
 * company. Each 6-indicator fiche pins its campaign year through the coordinate it
 * receives (year 2029, workforce 120), so both branches stay exercised.
 *
 * Extracted from `compliance.e2e.ts` (#4114): a distinct fixture axis (pinned
 * campaign year + workforce) that shares no state with the compliance fiches,
 * and no dependency on the notifications worker — only CAS-03 and CAS-09 need one,
 * and both stay in `compliance.e2e.ts`.
 */

const GRID = buildGrid();

test.describe("[CAS-01-6IND] Path 14: 6 indicators (no G) + no hasCse → direct completion", () => {
	const coordinate = pickCoordinate(GRID, {
		fiche: "CAS-01-6IND",
		effmax: "149",
		year: 2029,
	});

	test("submits the tier's funnel and completes the démarche directly", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-01-6IND"]({ page, coordinate });
	});
});

test.describe("[CAS-02-6IND] Path 15: 6 indicators (no G) + hasCse → /avis-cse", () => {
	const coordinate = pickCoordinate(GRID, {
		fiche: "CAS-02-6IND",
		effmax: "149",
		year: 2029,
	});

	test("submits the tier's funnel then deposits the CSE accuracy opinion", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-02-6IND"]({ page, coordinate });
	});
});

// ANX-04 — the OTHER branch of CAS-01/02-6IND: the same 100-149 company gains step 5
// in a triennial year from 2030 — the assertion that would have silently broken
// without #4067. Kept lightweight (funnel shape only): the full compliance flows
// for a 7-indicator company are already covered by the >= 250 baseline cases.
const SEVEN_INDICATOR_YEAR = 2030;

test.describe("[ANX-04] Path 14bis: 100-149 company regains indicator G in a triennial year >= 2030", () => {
	test("the funnel carries the indicator-G step (6 steps)", async ({
		page,
	}) => {
		await withCampaignYear(
			{ page, year: SEVEN_INDICATOR_YEAR, workforce: 120 },
			async () => {
				await page.goto(remunerationStepHref(1));
				await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
				await page.goto(remunerationStepHref(5));
				await expect(page.getByText("Étape 5 sur 6")).toBeVisible();
			},
		);
	});
});

// ANX-05 — the 50-99 tranche (scenarios S1/S2 of #4067): indicator G is absent
// below 2030 and returns only in a triennial year from 2030.
const SIX_INDICATOR_YEAR = 2029;

test.describe("[ANX-05] Path 13: 50-99 tranche — indicator G gated by the pinned year", () => {
	test.describe.configure({ mode: "serial" });

	test("6-indicator year (2029): step 5 is absent and unreachable by direct URL", async ({
		page,
	}) => {
		await withCampaignYear(
			{ page, year: SIX_INDICATOR_YEAR, workforce: 75 },
			async () => {
				await page.goto(remunerationStepHref(1));
				await expect(page.getByText("Étape 1 sur 5")).toBeVisible();
				// The categories step is out of reach even by URL: it redirects to the recap.
				await page.goto(remunerationStepHref(5));
				await page.waitForURL(urlGlob(remunerationStepHref(6)));
				await expect(page.getByText("Étape 5 sur 5")).toBeVisible();
			},
		);
	});

	test("7-indicator year (2030): step 5 is present and the stepper counts 6", async ({
		page,
	}) => {
		await withCampaignYear(
			{ page, year: SEVEN_INDICATOR_YEAR, workforce: 75 },
			async () => {
				// Initialise the declaration first so the step 5 URL is reachable.
				await page.goto(remunerationStepHref(1));
				await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
				await page.goto(remunerationStepHref(5));
				await expect(page.getByText("Étape 5 sur 6")).toBeVisible();
			},
		);
	});
});

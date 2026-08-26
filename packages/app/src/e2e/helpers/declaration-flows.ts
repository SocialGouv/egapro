import { type Page, test } from "@playwright/test";

/**
 * Fill all pay gap textboxes on steps 2 and 3. Every row is equal (no gap) by
 * default; passing annualMeanMen introduces a gap on the mean annual row, which
 * is the indicator A annual gap that drives the step 6 recap compliance box.
 */
async function fillPayGapTable(
	page: Page,
	options: { annualMeanMen?: string } = {},
) {
	const rows = [
		"Annuelle brute moyenne",
		"Horaire brute moyenne",
		"Annuelle brute médiane",
		"Horaire brute médiane",
	];
	for (const row of rows) {
		const men =
			row === "Annuelle brute moyenne"
				? (options.annualMeanMen ?? "1000")
				: "1000";
		await page.getByRole("textbox", { name: `${row} — Femmes` }).fill("1000");
		await page.getByRole("textbox", { name: `${row} — Hommes` }).fill(men);
	}
}

/**
 * Fill every pay measure of one indicator G category with the same women/men
 * pair. Since #3948 a category whose headcount is >= 1 for a sex requires all
 * four of that sex's pay amounts, so filling the annual base alone now blocks
 * the submit. Reusing one pair across the four measures keeps every computed
 * gap equal to the caller's intended gap.
 */
export async function fillCategoryPayAmounts(
	page: Page,
	options: { categoryIndex?: number; women: string; men: string },
) {
	const { categoryIndex = 1, women, men } = options;
	const measures = [
		"Salaire de base annuel",
		"Composantes variables annuelles",
		"Salaire de base horaire",
		"Composantes variables horaires",
	];
	for (const measure of measures) {
		await page
			.getByRole("textbox", {
				name: `${measure} femmes, catégorie ${categoryIndex}`,
			})
			.fill(women);
		await page
			.getByRole("textbox", {
				name: `${measure} hommes, catégorie ${categoryIndex}`,
			})
			.fill(men);
	}
}

type QuartileInputRow = {
	ordinal: "1er" | "2e" | "3e" | "4e";
	threshold?: string;
	women: string;
	men: string;
};

const DEFAULT_ANNUAL_QUARTILES: QuartileInputRow[] = [
	{ ordinal: "1er", threshold: "10000", women: "3", men: "4" },
	{ ordinal: "2e", threshold: "20000", women: "3", men: "4" },
	{ ordinal: "3e", threshold: "30000", women: "2", men: "4" },
	{ ordinal: "4e", women: "2", men: "3" },
];

const DEFAULT_HOURLY_QUARTILES: QuartileInputRow[] = [
	{ ordinal: "1er", threshold: "10", women: "3", men: "4" },
	{ ordinal: "2e", threshold: "20", women: "3", men: "4" },
	{ ordinal: "3e", threshold: "30", women: "2", men: "4" },
	{ ordinal: "4e", women: "2", men: "3" },
];

async function fillQuartileRow(
	page: Page,
	tableSuffix: "annuel" | "horaire",
	row: QuartileInputRow,
) {
	if (row.threshold !== undefined && row.ordinal !== "4e") {
		await page
			.getByRole("textbox", {
				name: `Seuil maximum ${row.ordinal} quartile ${tableSuffix}`,
			})
			.fill(row.threshold);
	}
	await page
		.getByRole("textbox", {
			name: `Nombre de femmes ${row.ordinal} quartile ${tableSuffix}`,
		})
		.fill(row.women);
	await page
		.getByRole("textbox", {
			name: `Nombre d'hommes ${row.ordinal} quartile ${tableSuffix}`,
		})
		.fill(row.men);
}

/**
 * Fill step 4 quartile data with consistent values (total = step 1 workforce).
 *
 * Each table accepts 3 thresholds (Q1/Q2/Q3 max) and 4 F/H counts.
 * Q4 has no upper threshold by spec.
 */
export async function fillStep4Quartiles(
	page: Page,
	options: {
		annualThresholds?: QuartileInputRow[];
		hourlyThresholds?: QuartileInputRow[];
	} = {},
) {
	const annual = options.annualThresholds ?? DEFAULT_ANNUAL_QUARTILES;
	const hourly = options.hourlyThresholds ?? DEFAULT_HOURLY_QUARTILES;
	for (const row of annual) {
		await fillQuartileRow(page, "annuel", row);
	}
	for (const row of hourly) {
		await fillQuartileRow(page, "horaire", row);
	}
}

/**
 * Changing a workforce that step 1 already holds opens a confirmation dialog
 * before saving, because it resets the GIP-prefilled indicators. A real user
 * confirms it; without this the funnel just never leaves step 1.
 */
async function confirmPrefillResetIfAsked(page: Page) {
	const confirm = page.getByRole("button", { name: "Continuer" });
	const asked = await confirm.isVisible({ timeout: 2_000 }).catch(() => false);
	if (asked) await confirm.click();
}

/**
 * Fill and submit steps 1 → 4, then click "Suivant" on the quartile step without
 * asserting the destination: it is step 5 when indicator G applies, step 6 otherwise.
 */
export async function submitStepsThroughQuartiles(
	page: Page,
	options: { annualMeanGap?: boolean } = {},
) {
	await test.step("étape 1 — effectifs", async () => {
		// Navigate to create/resume declaration → redirects to step 1
		await page.goto("/declaration-remuneration");
		await page.waitForURL("**/declaration-remuneration/etape/1");
		// 10 women + 15 men = 25 total, on both pay bases
		await page
			.getByRole("textbox", {
				name: "Rémunération annuelle — Nombre de femmes",
			})
			.fill("10");
		await page
			.getByRole("textbox", { name: "Rémunération annuelle — Nombre d'hommes" })
			.fill("15");
		await page
			.getByRole("textbox", { name: "Rémunération horaire — Nombre de femmes" })
			.fill("10");
		await page
			.getByRole("textbox", { name: "Rémunération horaire — Nombre d'hommes" })
			.fill("15");
		await page.getByRole("button", { name: "Suivant" }).click();
		await confirmPrefillResetIfAsked(page);
		await page.waitForURL("**/declaration-remuneration/etape/2");
	});

	await test.step("étape 2 — écarts de rémunération", async () => {
		// Mean annual row optionally carries the indicator A gap
		await fillPayGapTable(page, {
			annualMeanMen: options.annualMeanGap ? "1100" : "1000",
		});
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("**/declaration-remuneration/etape/3");
	});

	await test.step("étape 3 — composantes variables", async () => {
		await fillPayGapTable(page);
		await page.getByRole("textbox", { name: "Bénéficiaires femmes" }).fill("5");
		await page.getByRole("textbox", { name: "Bénéficiaires hommes" }).fill("5");
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("**/declaration-remuneration/etape/4");
	});

	await test.step("étape 4 — répartition par quartile", async () => {
		await fillStep4Quartiles(page);
		await page.getByRole("button", { name: "Suivant" }).click();
	});
}

/**
 * Fill step 5 employee categories so the computed indicator G gap lands above or
 * below the 5% alert threshold. women=1000, men=1100 → 9% gap (triggers
 * compliance); women=1000, men=1020 → 2% gap (no compliance).
 */
async function fillStep5Categories(page: Page, options: { hasGap: boolean }) {
	const menSalary = options.hasGap ? "1100" : "1020";

	// If categories are pre-populated (from getOrCreate), the source select
	// is replaced by read-only text. Only select source if the combobox exists.
	const sourceSelect = page.getByRole("combobox", {
		name: /source utilisée pour déterminer les catégories/i,
	});
	if (await sourceSelect.isVisible({ timeout: 1_000 }).catch(() => false)) {
		await sourceSelect.selectOption("accord-entreprise");
		await page.getByRole("textbox", { name: "Libellé" }).fill("Catégorie test");
		await page
			.getByRole("textbox", { name: "Effectif femmes, catégorie 1" })
			.fill("10");
		await page
			.getByRole("textbox", { name: "Effectif hommes, catégorie 1" })
			.fill("15");
	}

	// Fill salary data on category 1 (works for both fresh and pre-populated)
	await fillCategoryPayAmounts(page, { men: menSalary, women: "1000" });
}

/**
 * Fill the indicator G categories step and submit it, landing on the review step.
 * Only reachable when the company's tier owes indicator G on the campaign year.
 */
export async function submitIndicatorGStep(
	page: Page,
	options: { hasGap: boolean },
) {
	await test.step("étape 5 — écarts par catégorie", async () => {
		await fillStep5Categories(page, options);
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("**/declaration-remuneration/etape/6");
	});
}

/**
 * Fill steps 1 → 5 and stop on the step 6 review recap without submitting, so a
 * caller can assert on the recap ("Prochaines étapes" box) before certification.
 * Requires a company subject to indicator G (step 5), i.e. the suite baseline workforce.
 */
export async function reachStep6Recap(
	page: Page,
	options: { hasGap: boolean },
) {
	await submitStepsThroughQuartiles(page);
	await page.waitForURL("**/declaration-remuneration/etape/5");
	await submitIndicatorGStep(page, options);
}

/**
 * Fill a gap-free funnel up to the review step, whatever shape the campaign year gives
 * it: the categories step is only presented when the tier owes indicator G that year, so
 * the quartiles land either on it or straight on the review. Callers pass the expectation
 * derived from the domain (`indicatorGRequiredForGip`).
 */
export async function reachRecapWithoutGap(
	page: Page,
	options: { indicatorGRequired: boolean },
) {
	if (options.indicatorGRequired) {
		await reachStep6Recap(page, { hasGap: false });
		return;
	}
	await submitStepsThroughQuartiles(page);
	await page.waitForURL("**/declaration-remuneration/etape/6");
}

/**
 * Fill steps 1 → 5 with an indicator A annual gap ≥ 5% and stop on the step 6
 * review recap. The annual gap makes isComplianceProcessRequired true, so the
 * recap renders the "Prochaines étapes" (NextStepsBox) compliance box — the
 * surface that must gate its CSE-opinion mention on the declared CSE existence.
 */
export async function reachStep6ComplianceRecap(page: Page) {
	await submitStepsThroughQuartiles(page, { annualMeanGap: true });
	await page.waitForURL("**/declaration-remuneration/etape/5");
	await submitIndicatorGStep(page, { hasGap: true });
}

/**
 * Certify and submit from the step 6 recap, leaving the destination to the caller:
 * post-submission routing depends on the workforce, the gap and the CSE.
 */
export async function submitFromStep6Recap(page: Page) {
	await test.step("étape 6 — récapitulatif et transmission", async () => {
		await page.getByRole("button", { name: "Suivant" }).click();
		// Click the label, as the DSFR checkbox label intercepts pointer events.
		await page.getByText(/Je certifie/).click();
		await page.getByRole("button", { name: "Valider" }).click();
	});
}

/**
 * Fill and submit a complete declaration through all 6 steps.
 * Controls whether the employee category data produces a pay gap ≥ 5%.
 * Requires a company subject to indicator G (step 5), i.e. the suite baseline workforce.
 */
export async function completeDeclaration(
	page: Page,
	options: { hasGap: boolean },
) {
	await reachStep6Recap(page, options);
	await submitFromStep6Recap(page);

	// Wait for post-submission routing (compliance path or CSE or confirmation)
	await page.waitForURL(
		(url) => !url.pathname.includes("/declaration-remuneration/etape/"),
		{ timeout: 15_000 },
	);
}

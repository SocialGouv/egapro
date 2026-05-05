import type { Page } from "@playwright/test";

/** Fill all pay gap textboxes on steps 2 and 3 with equal values (no gap). */
async function fillPayGapTable(page: Page) {
	const rows = [
		"Annuelle brute moyenne",
		"Horaire brute moyenne",
		"Annuelle brute médiane",
		"Horaire brute médiane",
	];
	for (const row of rows) {
		await page.getByRole("textbox", { name: `${row} — Femmes` }).fill("1000");
		await page.getByRole("textbox", { name: `${row} — Hommes` }).fill("1000");
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
 * Fill and submit a complete declaration through all 6 steps.
 * Controls whether the employee category data produces a pay gap ≥ 5%.
 */
export async function completeDeclaration(
	page: Page,
	options: { hasGap: boolean },
) {
	// Navigate to create/resume declaration → redirects to step 1
	await page.goto("/declaration-remuneration");
	await page.waitForURL("**/declaration-remuneration/etape/1");

	// Step 1: Fill workforce (10 women + 15 men = 25 total)
	await page.getByRole("textbox", { name: "Nombre de femmes" }).fill("10");
	await page.getByRole("textbox", { name: "Nombre d'hommes" }).fill("15");
	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/declaration-remuneration/etape/2");

	// Step 2: Pay gap — fill all 8 fields with equal values
	await fillPayGapTable(page);
	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/declaration-remuneration/etape/3");

	// Step 3: Variable pay — same table + beneficiary counts
	await fillPayGapTable(page);
	await page.getByRole("textbox", { name: "Bénéficiaires femmes" }).fill("5");
	await page.getByRole("textbox", { name: "Bénéficiaires hommes" }).fill("5");
	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/declaration-remuneration/etape/4");

	// Step 4: Quartile distribution — fill 8 quartiles (4 annual + 4 hourly)
	await fillStep4Quartiles(page);
	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/declaration-remuneration/etape/5");

	// Step 5: Employee categories — fill salary data to control gap
	// Gap formula: |((men - women) / men) * 100|
	// women=1000, men=1100 → 9% gap (triggers compliance)
	// women=1000, men=1020 → 2% gap (no compliance)
	const menSalary = options.hasGap ? "1100" : "1020";

	// If categories are pre-populated (from getOrCreate), the source select
	// is replaced by read-only text. Only select source if the combobox exists.
	const sourceSelect = page.getByRole("combobox", {
		name: /source utilisée pour déterminer les catégories/i,
	});
	if (await sourceSelect.isVisible({ timeout: 1_000 }).catch(() => false)) {
		await sourceSelect.selectOption("convention-collective");
		await page.getByRole("textbox", { name: "Nom" }).fill("Catégorie test");
		await page
			.getByRole("textbox", { name: "Effectif femmes, catégorie 1" })
			.fill("10");
		await page
			.getByRole("textbox", { name: "Effectif hommes, catégorie 1" })
			.fill("15");
	}

	// Fill salary data on category 1 (works for both fresh and pre-populated)
	await page
		.getByRole("textbox", {
			name: "Salaire de base annuel femmes, catégorie 1",
		})
		.fill("1000");
	await page
		.getByRole("textbox", {
			name: "Salaire de base annuel hommes, catégorie 1",
		})
		.fill(menSalary);

	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/declaration-remuneration/etape/6");

	// Step 6: Submit declaration
	await page.getByRole("button", { name: "Suivant" }).click();
	// Certification modal
	await page.getByText(/Je certifie/).click();
	await page.getByRole("button", { name: "Valider" }).click();

	// Wait for post-submission routing (compliance path or CSE or confirmation)
	await page.waitForURL(
		(url) => !url.pathname.includes("/declaration-remuneration/etape/"),
		{ timeout: 15_000 },
	);
}

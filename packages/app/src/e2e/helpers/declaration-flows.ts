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

/** Fill step 4 quartile data with consistent values (total = step 1 workforce). */
async function fillStep4Quartiles(page: Page) {
	// Total must equal step 1 workforce: 10 women, 15 men
	// Split across 4 quartiles: 3+3+2+2=10 women, 4+4+4+3=15 men
	const quartiles = [
		{ name: "1er quartile", women: "3", men: "4" },
		{ name: "2e quartile", women: "3", men: "4" },
		{ name: "3e quartile", women: "2", men: "4" },
		{ name: "4e quartile", women: "2", men: "3" },
	] as const;

	for (const q of quartiles) {
		// Each quartile appears twice (annual table + hourly table) — fill both
		await page
			.getByRole("spinbutton", { name: `Nombre de femmes ${q.name}` })
			.nth(0)
			.fill(q.women);
		await page
			.getByRole("spinbutton", { name: `Nombre d'hommes ${q.name}` })
			.nth(0)
			.fill(q.men);
		await page
			.getByRole("textbox", { name: `Rémunération brute ${q.name}` })
			.nth(0)
			.fill("1000");
	}

	// Hourly table (same quartile names, second occurrence)
	for (const q of quartiles) {
		await page
			.getByRole("spinbutton", { name: `Nombre de femmes ${q.name}` })
			.nth(1)
			.fill(q.women);
		await page
			.getByRole("spinbutton", { name: `Nombre d'hommes ${q.name}` })
			.nth(1)
			.fill(q.men);
		await page
			.getByRole("textbox", { name: `Rémunération brute ${q.name}` })
			.nth(1)
			.fill("10");
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
	await page.getByRole("spinbutton", { name: "Nombre de femmes" }).fill("10");
	await page.getByRole("spinbutton", { name: "Nombre d'hommes" }).fill("15");
	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/declaration-remuneration/etape/2");

	// Step 2: Pay gap — fill all 8 fields with equal values
	await fillPayGapTable(page);
	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/declaration-remuneration/etape/3");

	// Step 3: Variable pay — same table + beneficiary counts
	await fillPayGapTable(page);
	await page
		.getByRole("spinbutton", { name: "Bénéficiaires femmes" })
		.fill("5");
	await page
		.getByRole("spinbutton", { name: "Bénéficiaires hommes" })
		.fill("5");
	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/declaration-remuneration/etape/4");

	// Step 4: Quartile distribution — fill 8 quartiles (4 annual + 4 hourly)
	await fillStep4Quartiles(page);
	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/declaration-remuneration/etape/5");

	// Step 5: Employee categories — fill one category with gap or no-gap salary
	// Gap formula: |((men - women) / men) * 100|
	// women=1000, men=1100 → 9% gap (triggers compliance)
	// women=1000, men=1020 → 2% gap (no compliance)
	const menSalary = options.hasGap ? "1100" : "1020";

	await page
		.getByRole("combobox", {
			name: /source utilisée pour déterminer les catégories/i,
		})
		.selectOption("csp");

	await page.getByRole("textbox", { name: "Nom" }).fill("Catégorie test");
	await page
		.getByRole("spinbutton", { name: "Effectif femmes, catégorie 1" })
		.fill("10");
	await page
		.getByRole("spinbutton", { name: "Effectif hommes, catégorie 1" })
		.fill("15");
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

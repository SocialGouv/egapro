import type { Page } from "@playwright/test";

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

	// Step 1: Fill workforce
	await page.getByRole("spinbutton", { name: "Nombre de femmes" }).fill("10");
	await page.getByRole("spinbutton", { name: "Nombre d'hommes" }).fill("15");
	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/declaration-remuneration/etape/2");

	// Steps 2-4: Click through (pre-populated from GIP-MDS or auto-saved)
	for (const step of [3, 4, 5]) {
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL(`**/declaration-remuneration/etape/${step}`);
	}

	// Step 5: Fill one employee category with gap or no-gap salary data
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

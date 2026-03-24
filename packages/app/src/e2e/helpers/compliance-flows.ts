import path from "node:path";
import type { Page } from "@playwright/test";

const DUMMY_PDF = path.join(import.meta.dirname, "../fixtures/dummy.pdf");
export const COMPLIANCE_PATH = "/declaration-remuneration/parcours-conformite";

export async function fillCseStep1(page: Page, hasSecondDeclaration = false) {
	await page.waitForURL("**/avis-cse/etape/1");
	// DSFR hides native radio inputs — click on the associated label instead
	await page.locator('label[for="first-decl-accuracy-favorable"]').click();
	await page.locator("#first-decl-accuracy-date").fill("2025-03-15");
	await page.locator('label[for="first-decl-gap-no"]').click();
	if (hasSecondDeclaration) {
		await page.locator('label[for="second-decl-accuracy-favorable"]').click();
		await page.locator("#second-decl-accuracy-date").fill("2025-06-15");
		await page.locator('label[for="second-decl-gap-no"]').click();
	}
	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL("**/avis-cse/etape/2");
}

export async function submitCseStep2(page: Page) {
	await page.locator("#cse-file-upload").setInputFiles(DUMMY_PDF);
	await page.getByRole("button", { name: "Soumettre" }).click();
	await page
		.getByText(/Je certifie que les avis transmis sont conformes/)
		.click();
	await page.getByRole("button", { name: "Valider" }).click();
	await page.waitForURL("**/avis-cse/confirmation", { timeout: 10_000 });
}

export async function uploadJointEvalPdf(page: Page) {
	await page.waitForURL("**/evaluation-conjointe");
	await page.locator("#joint-evaluation-file-upload").setInputFiles(DUMMY_PDF);
	await page.getByRole("button", { name: "Transmettre" }).click();
	await page
		.getByText(/Je certifie que le rapport transmis est conforme/)
		.click();
	await page.getByRole("button", { name: "Valider" }).click();
}

export async function selectCompliancePath(
	page: Page,
	pathId: "path-corrective" | "path-joint" | "path-justify",
) {
	await page.goto(COMPLIANCE_PATH);
	await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
	// DSFR hides native radio inputs — click on the associated label instead
	await page.locator(`label[for="${pathId}"]`).click();
	await page.getByRole("button", { name: "Suivant" }).click();
}

/**
 * Complete the corrective action second declaration flow (steps 1-3).
 * Step 1 is info-only, step 2 edits correction data, step 3 reviews and submits.
 * @param hasGap Whether the correction data should still have a gap ≥ 5%
 */
export async function completeSecondDeclaration(
	page: Page,
	options: { hasGap: boolean },
) {
	// Step 1: Info page — just click through
	await page.waitForURL(`**${COMPLIANCE_PATH}/etape/1`, { timeout: 10_000 });
	await page.getByRole("link", { name: "Suivant" }).click();
	await page.waitForURL(`**${COMPLIANCE_PATH}/etape/2`);

	// Step 2: Edit correction employee category data
	// women=1000, men=1100 → 9% gap | women=1000, men=1020 → 2% gap
	const menSalary = options.hasGap ? "1100" : "1020";
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

	// Fill required reference period dates
	await page.locator("#period-start-date").fill("2026-01-01");
	await page.locator("#period-end-date").fill("2026-12-31");

	await page.getByRole("button", { name: "Suivant" }).click();
	await page.waitForURL(`**${COMPLIANCE_PATH}/etape/3`);

	// Step 3: Review and submit
	await page
		.getByText(/Je certifie que les données saisies sont exactes/)
		.click();
	await page.getByRole("button", { name: "Soumettre" }).click();
}

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
	await page.waitForURL("**/avis-cse/confirmation");
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

export async function submitSecondDeclaration(
	page: Page,
	expectedUrlPattern: string,
) {
	await page.goto(`${COMPLIANCE_PATH}/etape/3`);
	await page
		.getByText(/Je certifie que les données saisies sont exactes/)
		.click();
	await page.getByRole("button", { name: "Soumettre" }).click();
	await page.waitForURL(expectedUrlPattern, { timeout: 10_000 });
}

import { expect, type Page, test } from "@playwright/test";

/** Navigate to a declaration step, ensuring the declaration is initialized first. */
async function goToStep(page: Page, step: number) {
	await page.goto("/declaration-remuneration");
	await page.waitForURL("**/declaration-remuneration/etape/**");
	await page.goto(`/declaration-remuneration/etape/${step}`);
	await page.waitForURL(`**/declaration-remuneration/etape/${step}`);
	await expect(page.getByText(`Étape ${step} sur 6`)).toBeVisible();
}

test.describe("Declaration workflow", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeEach(async ({ page }) => {
		// Auth is handled by storageState from auth.setup.ts
		await page.goto("/declaration-remuneration");
		await page.waitForURL("**/declaration-remuneration/etape/**");
	});

	test("displays step 1 after login", async ({ page }) => {
		await expect(
			page.getByRole("heading", {
				name: /Déclarer les indicateurs pour l'ensemble/i,
			}),
		).toBeVisible();

		await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
	});

	test("shows company name and SIREN in banner", async ({ page }) => {
		await expect(page.getByText(/130 025 265/)).toBeVisible();
		await expect(
			page.getByText(/DIRECTION INTERMINISTERIELLE DU NUMERIQUE/),
		).toBeVisible();
	});

	test("navigates through step 1 - Effectifs", async ({ page }) => {
		await page.waitForURL("**/declaration-remuneration/etape/1");

		// Verify stepper
		await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Effectifs/i }),
		).toBeVisible();

		// Fill workforce data directly in the table
		await page.getByRole("spinbutton", { name: "Nombre de femmes" }).fill("10");
		await page.getByRole("spinbutton", { name: "Nombre d'hommes" }).fill("15");

		// Verify total is computed
		await expect(page.getByText("25", { exact: true })).toBeVisible();

		// Submit and navigate to step 2
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("**/declaration-remuneration/etape/2");
	});

	test("step 2 - Écart de rémunération inline editing", async ({ page }) => {
		await goToStep(page, 2);

		await expect(page.getByText("Étape 2 sur 6")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Écart de rémunération/i }),
		).toBeVisible();

		// Fill pay gap data directly in the table
		await page
			.getByRole("textbox", { name: "Annuelle brute moyenne — Femmes" })
			.fill("30000");
		await page
			.getByRole("textbox", { name: "Annuelle brute moyenne — Hommes" })
			.fill("32000");

		// Verify gap is computed and displayed
		await expect(page.getByText("6,3 %", { exact: true })).toBeVisible();
	});

	test("step 3 - Rémunération variable inline editing", async ({ page }) => {
		await goToStep(page, 3);

		await expect(page.getByText("Étape 3 sur 6")).toBeVisible();

		// Fill variable pay data directly in the table
		await page
			.getByRole("textbox", { name: "Annuelle brute moyenne — Femmes" })
			.fill("5000");
		await page
			.getByRole("textbox", { name: "Annuelle brute moyenne — Hommes" })
			.fill("5500");

		// Verify gap is computed
		await expect(page.getByText("9,1 %")).toBeVisible();

		// Verify beneficiary inputs are present
		await expect(
			page.getByRole("spinbutton", { name: "Bénéficiaires femmes" }),
		).toBeVisible();
		await expect(
			page.getByRole("spinbutton", { name: "Bénéficiaires hommes" }),
		).toBeVisible();
	});

	test("step 4 - Proportion quartiles page structure", async ({ page }) => {
		await goToStep(page, 4);

		await expect(page.getByText("Étape 4 sur 6")).toBeVisible();

		// Verify quartile column headers exist in the table
		await expect(
			page.getByRole("columnheader", { name: "1er quartile" }).first(),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "4e quartile" }).first(),
		).toBeVisible();
	});

	test("step 5 - Catégories de salariés page structure", async ({ page }) => {
		await goToStep(page, 5);

		await expect(page.getByText("Étape 5 sur 6")).toBeVisible();

		// Verify category source combobox
		await expect(
			page.getByRole("combobox", {
				name: /source utilisée pour déterminer les catégories/i,
			}),
		).toBeVisible();

		// Verify category 1 form fields
		await expect(page.getByRole("textbox", { name: "Nom" })).toBeVisible();
		await expect(
			page.getByRole("spinbutton", { name: "Effectif femmes, catégorie 1" }),
		).toBeVisible();
		await expect(
			page.getByRole("textbox", {
				name: "Salaire de base annuel femmes, catégorie 1",
			}),
		).toBeVisible();
	});

	test("step 6 - Review page", async ({ page }) => {
		await goToStep(page, 6);

		await expect(page.getByText("Étape 6 sur 6")).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: /Récapitulatif de votre déclaration/i,
			}),
		).toBeVisible();
	});

	test("accordion displays definitions", async ({ page }) => {
		await goToStep(page, 1);

		const accordion = page.getByRole("button", {
			name: /Définitions et méthode de calcul/i,
		});
		await expect(accordion).toBeVisible();
	});

	test("previous button navigates back", async ({ page }) => {
		await page.goto("/declaration-remuneration/etape/2");

		await page.getByRole("link", { name: "Précédent" }).click();
		await page.waitForURL("**/declaration-remuneration/etape/1");
	});

	test("previous button is present on step pages", async ({ page }) => {
		await goToStep(page, 6);

		const previousLink = page.getByRole("link", { name: "Précédent" });
		await expect(previousLink).toBeVisible();
	});

	// Must be last — mutates declaration status to 'submitted'
	test("step 6 submit navigates to CSE opinion page", async ({ page }) => {
		await goToStep(page, 6);

		// Click the "Suivant" submit button to open the confirmation modal
		await page.getByRole("button", { name: "Suivant" }).click();

		// Check the certification checkbox (click on the label, as DSFR checkbox label intercepts pointer events)
		await page.getByText(/Je certifie/).click();
		await page.getByRole("button", { name: "Valider" }).click();

		// Verify navigation to the CSE opinion page (hasCse=true set by global-setup, no gap → direct redirect)
		await page.waitForURL("**/avis-cse/**");
	});
});

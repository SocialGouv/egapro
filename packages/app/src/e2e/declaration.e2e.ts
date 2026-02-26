import { expect, test } from "@playwright/test";

test.describe("Declaration workflow", () => {
	test.beforeEach(async ({ page }) => {
		// Login via ProConnect with test account
		await page.goto("/login");
		await page
			.getByRole("button", { name: "Se connecter avec ProConnect" })
			.click();

		// Fill ProConnect login form (test@fia1.fr)
		await page.getByLabel("Email").fill("test@fia1.fr");
		await page.getByRole("button", { name: /continuer|connexion/i }).click();

		// Handle FIA1V2 identity provider login page
		await page.getByRole("button", { name: "Se connecter" }).click();

		// Wait for redirect to declaration intro
		await page.waitForURL("**/declaration-remuneration");
	});

	test("displays introduction page after login", async ({ page }) => {
		await expect(
			page.getByRole("heading", {
				name: "Déclarer les indicateurs de rémunération",
			}),
		).toBeVisible();

		await expect(page.getByRole("link", { name: "Commencer" })).toBeVisible();
	});

	test("shows company info in banner", async ({ page }) => {
		await expect(page.getByText(/Mon entreprise/)).toBeVisible();
	});

	test("navigates through step 1 - Effectifs", async ({ page }) => {
		await page.getByRole("link", { name: "Commencer" }).click();
		await page.waitForURL("**/declaration-remuneration/etape/1");

		// Verify stepper
		await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Effectifs/i }),
		).toBeVisible();

		// Open edit modal to fill workforce data
		await page.getByRole("button", { name: "Modifier les effectifs" }).click();

		// Fill workforce data in modal
		await page.getByRole("spinbutton", { name: "Femmes" }).fill("10");
		await page.getByRole("spinbutton", { name: "Hommes" }).fill("15");

		// Save and close modal
		await page.getByRole("button", { name: "Enregistrer" }).click();

		// Verify totals in table
		await expect(page.getByRole("cell", { name: "10" }).first()).toBeVisible();
		await expect(page.getByRole("cell", { name: "15" }).first()).toBeVisible();

		// Submit and navigate to step 2
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("**/declaration-remuneration/etape/2");
	});

	test("step 2 - Écart de rémunération page and modal editing", async ({
		page,
	}) => {
		await page.goto("/declaration-remuneration/etape/2");

		await expect(page.getByText("Étape 2 sur 6")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Écart de rémunération/i }),
		).toBeVisible();

		// Edit first pay row via modal
		await page
			.getByRole("button", { name: "Modifier Annuelle brute moyenne" })
			.click();
		await page
			.getByRole("spinbutton", { name: "Rémunération Femmes" })
			.fill("30000");
		await page
			.getByRole("spinbutton", { name: "Rémunération Hommes" })
			.fill("32000");
		await page.getByRole("button", { name: "Enregistrer" }).click();

		// Verify saved values appear in the table
		await expect(
			page.getByRole("cell", { name: "30000" }).first(),
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "32000" }).first(),
		).toBeVisible();
	});

	test("step 3 - Rémunération variable page and modal editing", async ({
		page,
	}) => {
		await page.goto("/declaration-remuneration/etape/3");

		await expect(page.getByText("Étape 3 sur 6")).toBeVisible();

		// Edit first pay row via modal
		await page
			.getByRole("button", { name: "Modifier Annuelle brute moyenne" })
			.click();
		await page
			.getByRole("spinbutton", { name: "Rémunération Femmes" })
			.fill("5000");
		await page
			.getByRole("spinbutton", { name: "Rémunération Hommes" })
			.fill("5500");
		await page.getByRole("button", { name: "Enregistrer" }).click();

		// Verify saved values appear in the table
		await expect(
			page.getByRole("cell", { name: "5000" }).first(),
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "5500" }).first(),
		).toBeVisible();
	});

	test("step 4 - Proportion quartiles page structure", async ({ page }) => {
		await page.goto("/declaration-remuneration/etape/4");

		await expect(page.getByText("Étape 4 sur 6")).toBeVisible();

		// Verify quartile column headers exist in the table
		await expect(
			page.getByRole("columnheader", { name: "1er quartile" }).first(),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "4e quartile" }).first(),
		).toBeVisible();
	});

	test("step 5 - Catégories de salariés page structure", async ({
		page,
	}) => {
		await page.goto("/declaration-remuneration/etape/5");

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
			page.getByRole("spinbutton", {
				name: "Salaire de base annuel femmes, catégorie 1",
			}),
		).toBeVisible();
	});

	test("step 6 - Review page", async ({ page }) => {
		await page.goto("/declaration-remuneration/etape/6");

		await expect(page.getByText("Étape 6 sur 6")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Vérifier les informations/i }),
		).toBeVisible();
	});

	test("accordion displays definitions", async ({ page }) => {
		await page.goto("/declaration-remuneration/etape/1");

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
});

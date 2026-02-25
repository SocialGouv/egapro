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

		// Wait for redirect to declaration intro
		await page.waitForURL("/declaration-remuneration");
	});

	test("displays introduction page after login", async ({ page }) => {
		await expect(
			page.getByRole("heading", {
				name: "Déclarer les indicateurs de rémunération",
			}),
		).toBeVisible();

		await expect(page.getByRole("link", { name: "Commencer" })).toBeVisible();
	});

	test("shows SIREN in blue banner", async ({ page }) => {
		await expect(page.getByText(/SIREN :/)).toBeVisible();
	});

	test("navigates through step 1 - Effectifs", async ({ page }) => {
		await page.getByRole("link", { name: "Commencer" }).click();
		await page.waitForURL("/declaration-remuneration/etape/1");

		// Verify stepper
		await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Effectifs/i }),
		).toBeVisible();

		// Fill workforce data
		const womenInputs = page.getByLabel(/Femmes/);
		const menInputs = page.getByLabel(/Hommes/);

		await womenInputs.nth(0).fill("10"); // Ouvriers
		await menInputs.nth(0).fill("15");
		await womenInputs.nth(1).fill("20"); // Employés
		await menInputs.nth(1).fill("25");
		await womenInputs.nth(2).fill("8"); // Techniciens
		await menInputs.nth(2).fill("12");
		await womenInputs.nth(3).fill("5"); // Ingénieurs
		await menInputs.nth(3).fill("10");

		// Verify total is displayed
		await expect(page.getByText("43")).toBeVisible(); // Total women
		await expect(page.getByText("62")).toBeVisible(); // Total men

		// Submit and navigate to step 2
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("/declaration-remuneration/etape/2");
	});

	test("navigates through step 2 - Écart de rémunération", async ({ page }) => {
		await page.goto("/declaration-remuneration/etape/2");

		await expect(page.getByText("Étape 2 sur 6")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Écart de rémunération/i }),
		).toBeVisible();

		// Fill pay gap data for each category
		const inputs = page.locator("input[type='number']");
		for (let i = 0; i < (await inputs.count()); i++) {
			await inputs.nth(i).fill(String(1000 + i * 100));
		}

		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("/declaration-remuneration/etape/3");
	});

	test("navigates through step 3 - Rémunération variable", async ({ page }) => {
		await page.goto("/declaration-remuneration/etape/3");

		await expect(page.getByText("Étape 3 sur 6")).toBeVisible();

		const inputs = page.locator("input[type='number']");
		for (let i = 0; i < (await inputs.count()); i++) {
			await inputs.nth(i).fill(String(500 + i * 50));
		}

		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("/declaration-remuneration/etape/4");
	});

	test("navigates through step 4 - Proportion quartiles", async ({ page }) => {
		await page.goto("/declaration-remuneration/etape/4");

		await expect(page.getByText("Étape 4 sur 6")).toBeVisible();

		const inputs = page.locator("input[type='number']");
		for (let i = 0; i < (await inputs.count()); i++) {
			await inputs.nth(i).fill(String(10 + i));
		}

		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("/declaration-remuneration/etape/5");
	});

	test("navigates through step 5 - Catégories de salariés", async ({
		page,
	}) => {
		await page.goto("/declaration-remuneration/etape/5");

		await expect(page.getByText("Étape 5 sur 6")).toBeVisible();

		// Fill first category
		await page
			.getByLabel(/Catégorie d'emplois/)
			.first()
			.fill("Développeurs");
		await page.locator("input[type='number']").nth(0).fill("3000");
		await page.locator("input[type='number']").nth(1).fill("3200");

		// Add a second category
		await page.getByRole("button", { name: /Ajouter une catégorie/ }).click();
		await page
			.getByLabel(/Catégorie d'emplois/)
			.nth(1)
			.fill("Designers");
		await page.locator("input[type='number']").nth(2).fill("2800");
		await page.locator("input[type='number']").nth(3).fill("2900");

		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("/declaration-remuneration/etape/6");
	});

	test("step 6 - Review and submit", async ({ page }) => {
		await page.goto("/declaration-remuneration/etape/6");

		await expect(page.getByText("Étape 6 sur 6")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Vérifier les informations/i }),
		).toBeVisible();

		// Verify recap sections exist
		await expect(
			page.getByRole("heading", { name: "Effectifs" }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Écart de rémunération$/i }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: /Rémunération variable/i,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /quartile/i }),
		).toBeVisible();

		// Submit declaration
		await page
			.getByRole("button", { name: "Soumettre la déclaration" })
			.click();

		// Confirmation dialog appears
		await expect(
			page.getByRole("heading", { name: "Confirmer la soumission" }),
		).toBeVisible();

		await page.getByRole("button", { name: "Confirmer" }).click();

		// Should redirect back to intro after submission
		await page.waitForURL("/declaration-remuneration");
	});

	test("accordion displays definitions", async ({ page }) => {
		await page.goto("/declaration-remuneration/etape/1");

		const accordion = page.getByRole("button", {
			name: /Définitions et méthode de calcul/i,
		});
		await expect(accordion).toBeVisible();
		await accordion.click();

		await expect(page.getByText(/Lorem ipsum dolor sit amet/)).toBeVisible();
	});

	test("previous button navigates back", async ({ page }) => {
		await page.goto("/declaration-remuneration/etape/2");

		await page.getByRole("link", { name: "Précédent" }).click();
		await page.waitForURL("/declaration-remuneration/etape/1");
	});

	test("complete flow end-to-end", async ({ page }) => {
		// Step 0: Introduction
		await page.getByRole("link", { name: "Commencer" }).click();
		await page.waitForURL("/declaration-remuneration/etape/1");

		// Step 1: Effectifs
		const womenInputs = page.getByLabel(/Femmes/);
		const menInputs = page.getByLabel(/Hommes/);
		await womenInputs.nth(0).fill("10");
		await menInputs.nth(0).fill("15");
		await womenInputs.nth(1).fill("20");
		await menInputs.nth(1).fill("25");
		await womenInputs.nth(2).fill("8");
		await menInputs.nth(2).fill("12");
		await womenInputs.nth(3).fill("5");
		await menInputs.nth(3).fill("10");
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("/declaration-remuneration/etape/2");

		// Step 2: Écart de rémunération
		let inputs = page.locator("input[type='number']");
		for (let i = 0; i < (await inputs.count()); i++) {
			await inputs.nth(i).fill(String(2000 + i * 100));
		}
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("/declaration-remuneration/etape/3");

		// Step 3: Rémunération variable
		inputs = page.locator("input[type='number']");
		for (let i = 0; i < (await inputs.count()); i++) {
			await inputs.nth(i).fill(String(500 + i * 50));
		}
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("/declaration-remuneration/etape/4");

		// Step 4: Proportion quartiles
		inputs = page.locator("input[type='number']");
		for (let i = 0; i < (await inputs.count()); i++) {
			await inputs.nth(i).fill(String(10 + i));
		}
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("/declaration-remuneration/etape/5");

		// Step 5: Catégories de salariés
		await page
			.getByLabel(/Catégorie d'emplois/)
			.first()
			.fill("Managers");
		await page.locator("input[type='number']").nth(0).fill("4000");
		await page.locator("input[type='number']").nth(1).fill("4200");
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("/declaration-remuneration/etape/6");

		// Step 6: Review and submit
		await expect(
			page.getByRole("heading", { name: /Vérifier les informations/i }),
		).toBeVisible();
		await page
			.getByRole("button", { name: "Soumettre la déclaration" })
			.click();
		await page.getByRole("button", { name: "Confirmer" }).click();
		await page.waitForURL("/declaration-remuneration");
	});
});

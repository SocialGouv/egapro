import { expect, type Page, test } from "@playwright/test";
import { resetDeclarationToDraft } from "./helpers/db";

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

	// Reset DB state before this suite runs so it starts from a clean slate.
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
	});

	test.beforeEach(async ({ page }) => {
		// Auth is handled by storageState from auth.setup.ts
		await page.goto("/declaration-remuneration");
		await page.waitForURL("**/declaration-remuneration/etape/**");
	});

	test("displays step 1 after login", async ({ page }) => {
		await expect(
			page.getByRole("heading", {
				name: /Déclaration des indicateurs de rémunération/i,
			}),
		).toBeVisible();

		await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
	});

	test("shows company name and SIREN in banner", async ({ page }) => {
		await expect(page.getByText(/130 025 265/)).toBeVisible();
		// Company name comes from external Weez API; may fall back to "Entreprise {siren}"
		await expect(
			page.getByText(
				/DIRECTION INTERMINISTERIELLE DU NUMERIQUE|Entreprise 130025265/,
			),
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
		await page.getByRole("textbox", { name: "Nombre de femmes" }).fill("10");
		await page.getByRole("textbox", { name: "Nombre d'hommes" }).fill("15");

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

		// Verify gap is computed and displayed in the table cell
		await expect(
			page.getByRole("table").getByText("6,3 %", { exact: true }),
		).toBeVisible();
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
			page.getByRole("textbox", { name: "Bénéficiaires femmes" }),
		).toBeVisible();
		await expect(
			page.getByRole("textbox", { name: "Bénéficiaires hommes" }),
		).toBeVisible();
	});

	test("step 4 - inverted quartile table layout (rows = quartiles, columns = F/H/%F/%H)", async ({
		page,
	}) => {
		await goToStep(page, 4);

		await expect(page.getByText("Étape 4 sur 6")).toBeVisible();

		// S1 — quartile labels live in rowheaders (rows are quartiles in the new layout)
		await expect(
			page.getByRole("rowheader", { name: /1er quartile/ }).first(),
		).toBeVisible();
		await expect(
			page.getByRole("rowheader", { name: /4e quartile/ }).first(),
		).toBeVisible();
		// "Tous les salariés" total row exists in both tables
		await expect(
			page.getByRole("rowheader", { name: "Tous les salariés" }),
		).toHaveCount(2);
		// Header row exposes the new column "Nombre de femmes" / "Nombre d'hommes"
		await expect(
			page.getByRole("columnheader", { name: /Nombre de femmes/ }).first(),
		).toBeVisible();
		// Accordion present
		await expect(
			page.getByRole("button", { name: /Définitions et méthode de calcul/ }),
		).toBeVisible();
	});

	test("step 4 - cascade: filling Q1 threshold updates Q2 lower bound live", async ({
		page,
	}) => {
		await goToStep(page, 4);

		// Scope to the annual table — the hourly table is pre-populated with
		// GIP-MDS data for the test SIREN.
		const annualTable = page.getByRole("table", {
			name: "Rémunération annuelle brute moyenne",
		});

		// S2 — fill annual Q1 max (the only threshold input on the Q1 row)
		const seuil1Annual = annualTable.getByRole("textbox", {
			name: "Seuil maximum 1er quartile annuel",
		});
		await seuil1Annual.fill("20000");

		// Q2 row's first cell is the lower-bound, computed from Q1 threshold
		// + 0,01 → "20 000,01 €" (live cascade update).
		const q2Row = annualTable.locator("tbody > tr").filter({
			has: page.getByRole("rowheader", { name: "2e quartile" }),
		});
		await expect(q2Row.locator("td").first()).toHaveText("20 000,01 €");
	});

	test("step 4 - non-crescent thresholds trigger recap alert with anchors (S3)", async ({
		page,
	}) => {
		await goToStep(page, 4);

		// Fill non-crescent annual thresholds : 30000, 20000, 40000
		await page
			.getByRole("textbox", { name: "Seuil maximum 1er quartile annuel" })
			.fill("30000");
		await page
			.getByRole("textbox", { name: "Seuil maximum 2e quartile annuel" })
			.fill("20000");
		await page
			.getByRole("textbox", { name: "Seuil maximum 3e quartile annuel" })
			.fill("40000");

		// Fill hourly thresholds (valid) and all 8 counts to isolate the croissance error
		await page
			.getByRole("textbox", { name: "Seuil maximum 1er quartile horaire" })
			.fill("10");
		await page
			.getByRole("textbox", { name: "Seuil maximum 2e quartile horaire" })
			.fill("20");
		await page
			.getByRole("textbox", { name: "Seuil maximum 3e quartile horaire" })
			.fill("30");
		for (const ordinal of ["1er", "2e", "3e", "4e"] as const) {
			await page
				.getByRole("textbox", {
					name: `Nombre de femmes ${ordinal} quartile annuel`,
				})
				.fill("1");
			await page
				.getByRole("textbox", {
					name: `Nombre d'hommes ${ordinal} quartile annuel`,
				})
				.fill("1");
			await page
				.getByRole("textbox", {
					name: `Nombre de femmes ${ordinal} quartile horaire`,
				})
				.fill("1");
			await page
				.getByRole("textbox", {
					name: `Nombre d'hommes ${ordinal} quartile horaire`,
				})
				.fill("1");
		}

		await page.getByRole("button", { name: "Suivant" }).click();

		// Recap alert with anchor links
		const alert = page.getByRole("alert").first();
		await expect(alert).toBeVisible();
		await expect(alert).toContainText(/Le formulaire contient des erreurs/);
		await expect(
			alert
				.getByRole("link")
				.filter({
					has: page.locator("text=/quartile/"),
				})
				.first(),
		).toBeVisible();
	});

	test("step 4 - empty submission shows 'Le seuil est obligatoire' on threshold cells (S4)", async ({
		page,
	}) => {
		await goToStep(page, 4);

		// The test SIREN has GIP-MDS prefilled thresholds — clear them so the
		// "all empty → required errors" path is exercised.
		for (const ordinal of ["1er", "2e", "3e"] as const) {
			await page
				.getByRole("textbox", {
					name: `Seuil maximum ${ordinal} quartile annuel`,
				})
				.fill("");
			await page
				.getByRole("textbox", {
					name: `Seuil maximum ${ordinal} quartile horaire`,
				})
				.fill("");
		}

		await page.getByRole("button", { name: "Suivant" }).click();

		// At least one error message per missing threshold
		await expect(
			page.getByText("Le seuil est obligatoire").first(),
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
		await expect(page.getByRole("textbox", { name: "Libellé" })).toBeVisible();
		await expect(
			page.getByRole("textbox", { name: "Effectif femmes, catégorie 1" }),
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
	test("step 6 submit leaves declaration page", async ({ page }) => {
		await goToStep(page, 6);

		// Click the "Suivant" submit button to open the confirmation modal
		await page.getByRole("button", { name: "Suivant" }).click();

		// Check the certification checkbox (click on the label, as DSFR checkbox label intercepts pointer events)
		await page.getByText(/Je certifie/).click();
		await page.getByRole("button", { name: "Valider" }).click();

		// After submission, compliance path kicks in. Destination depends on hasCse
		// and gap state — exact routing is tested in compliance.e2e.ts.
		// Here we just verify we left the declaration wizard.
		await page.waitForURL(
			(url) => !url.pathname.includes("/declaration-remuneration/etape/"),
			{ timeout: 15_000 },
		);
	});
});

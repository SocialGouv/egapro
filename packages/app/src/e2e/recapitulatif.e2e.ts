import { expect, test } from "@playwright/test";
import { setDeclarationComplianceState } from "./helpers/db";

test.describe("Recapitulatif page", () => {
	test.beforeAll(async () => {
		await setDeclarationComplianceState({
			status: "awaiting_compliance_path_choice",
			currentStep: 6,
		});
	});

	test("displays recap page with h1 and download button", async ({ page }) => {
		await page.goto("/declaration-remuneration/recapitulatif");

		await expect(
			page.getByRole("heading", {
				level: 1,
				name: /Déclaration des indicateurs de rémunération/,
			}),
		).toBeVisible();

		await expect(page.getByRole("link", { name: "Télécharger" })).toBeVisible();
	});

	test("displays info sections", async ({ page }) => {
		await page.goto("/declaration-remuneration/recapitulatif");

		await expect(
			page.getByRole("heading", {
				level: 2,
				name: "Informations déclarant",
			}),
		).toBeVisible();

		await expect(
			page.getByRole("heading", {
				level: 2,
				name: "Informations entreprise",
			}),
		).toBeVisible();

		await expect(
			page.getByRole("heading", {
				level: 2,
				name: "Informations calcul",
			}),
		).toBeVisible();
	});

	test("displays indicator sections", async ({ page }) => {
		await page.goto("/declaration-remuneration/recapitulatif");

		await expect(
			page.getByText("Indicateurs pour l'ensemble de vos salariés"),
		).toBeVisible();

		await expect(
			page.getByText("Indicateurs par catégorie de salariés"),
		).toBeVisible();
	});

	test("displays return button", async ({ page }) => {
		await page.goto("/declaration-remuneration/recapitulatif");

		await expect(page.getByRole("link", { name: "Mon espace" })).toBeVisible();
	});

	test("returns 404 for non-submitted declaration with correction type", async ({
		page,
	}) => {
		const response = await page.goto(
			"/declaration-remuneration/recapitulatif?type=correction",
		);
		expect(response?.status()).toBe(404);
	});
});

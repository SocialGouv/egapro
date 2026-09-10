import { expect, test } from "@playwright/test";
import { urlGlob } from "~/e2e/helpers/routes";
import { DECLARATION_REMUNERATION_RECAP, MY_SPACE } from "~/modules/routes";
import { setDeclarationComplianceState } from "./helpers/db";

// Recap-page rendering is covered by recapitulatif/__tests__/RecapitulatifPage.test.tsx.

test.describe("Recapitulatif page", () => {
	test.beforeAll(async () => {
		await setDeclarationComplianceState({
			status: "awaiting_compliance_path_choice",
			currentStep: 6,
		});
	});

	test("renders the recap route with its heading and download button", async ({
		page,
	}) => {
		await page.goto(DECLARATION_REMUNERATION_RECAP);

		await expect(
			page.getByRole("heading", {
				level: 1,
				name: /Déclaration des indicateurs de rémunération/,
			}),
		).toBeVisible();
		await expect(page.getByRole("link", { name: "Télécharger" })).toBeVisible();
	});

	test("closes on a secondary 'Mon espace' action that returns to Mon espace", async ({
		page,
	}) => {
		await page.goto(DECLARATION_REMUNERATION_RECAP);

		// Scoped to <main>: the breadcrumb above it links to "Mon espace" too.
		const bottomAction = page
			.getByRole("main")
			.getByRole("link", { name: "Mon espace", exact: true });

		await expect(bottomAction).toHaveClass(/fr-btn--secondary/);
		await expect(bottomAction).not.toHaveClass(/fr-btn--primary/);
		await expect(
			page.getByRole("link", { name: "Retour à Mon Espace" }),
		).toHaveCount(0);

		await bottomAction.click();
		await page.waitForURL(urlGlob(MY_SPACE));
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

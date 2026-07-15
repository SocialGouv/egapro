import { expect, test } from "@playwright/test";
import { setDeclarationComplianceState } from "./helpers/db";

// The recap page rendering (declarant / company / calcul info, indicator &
// category sections, download button, return link) is covered by
// src/modules/declaration-remuneration/recapitulatif/__tests__/RecapitulatifPage.test.tsx
// (+ RecapitulatifPage.correction.test.tsx). Only the route render smoke and the
// 404 for a non-submitted correction remain end-to-end.

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
		await page.goto("/declaration-remuneration/recapitulatif");

		await expect(
			page.getByRole("heading", {
				level: 1,
				name: /Déclaration des indicateurs de rémunération/,
			}),
		).toBeVisible();
		await expect(page.getByRole("link", { name: "Télécharger" })).toBeVisible();
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

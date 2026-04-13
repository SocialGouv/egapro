import { expect, type Page, test } from "@playwright/test";
import {
	deleteCurrentYearCategories,
	deletePreviousYearDeclaration,
	insertPreviousYearDeclaration,
	resetDeclarationToDraft,
} from "./helpers/db";

async function goToStep5(page: Page) {
	await page.goto("/declaration-remuneration");
	await page.waitForURL("**/declaration-remuneration/etape/**");
	await page.goto("/declaration-remuneration/etape/5");
	await page.waitForURL("**/declaration-remuneration/etape/5");
	await expect(page.getByText("Étape 5 sur 6")).toBeVisible();
}

test.describe("Previous year categories prefill", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await deleteCurrentYearCategories();
		await insertPreviousYearDeclaration();
	});

	test.afterAll(async () => {
		await deletePreviousYearDeclaration();
	});

	test("pre-fills N-1 category names, details and source with empty numeric fields", async ({
		page,
	}) => {
		await goToStep5(page);

		// Source pre-filled from N-1
		await expect(
			page.getByRole("combobox", { name: /source utilisée/i }),
		).toHaveValue("convention-collective");

		// 3 categories pre-filled
		await expect(page.getByText("Nombre de catégories : 3")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Cadres dirigeants/ }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Ingénieurs et cadres/ }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Techniciens/ }),
		).toBeVisible();

		// Detail pre-filled, numeric fields empty
		await page.getByRole("button", { name: /Cadres dirigeants/ }).click();
		await expect(page.locator("#cat-0-detail")).toHaveValue(
			"Directeurs et cadres supérieurs",
		);
		await expect(
			page.getByRole("textbox", { name: "Effectif femmes, catégorie 1" }),
		).toHaveValue("");
		await expect(
			page.getByRole("textbox", {
				name: "Salaire de base annuel femmes, catégorie 1",
			}),
		).toHaveValue("");
	});
});

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

async function assertStep5PrefilledWithSeedData(page: Page) {
	// Source pre-filled from the previous declaration
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
	await expect(page.getByRole("button", { name: /Techniciens/ })).toBeVisible();

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
}

test.describe("Previous year categories prefill", () => {
	test.describe("N-1 declaration contains indicator 7", () => {
		test.beforeAll(async () => {
			await resetDeclarationToDraft();
			await deleteCurrentYearCategories();
			await insertPreviousYearDeclaration(1);
		});

		test.afterAll(async () => {
			await deletePreviousYearDeclaration(1);
		});

		test("pre-fills category names, details and source with empty numeric fields", async ({
			page,
		}) => {
			await goToStep5(page);
			await assertStep5PrefilledWithSeedData(page);
		});
	});

	test.describe("N-1 skipped, N-2 contains indicator 7", () => {
		test.beforeAll(async () => {
			await resetDeclarationToDraft();
			await deleteCurrentYearCategories();
			// Make sure no N-1 seed is left over from a previous run.
			await deletePreviousYearDeclaration(1);
			await insertPreviousYearDeclaration(2);
		});

		test.afterAll(async () => {
			await deletePreviousYearDeclaration(2);
		});

		test("falls back to N-2 when N-1 is missing", async ({ page }) => {
			await goToStep5(page);
			await assertStep5PrefilledWithSeedData(page);
		});
	});
});

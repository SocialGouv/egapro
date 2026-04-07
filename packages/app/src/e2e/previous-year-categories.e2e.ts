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

test.describe("Previous year categories import", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await deleteCurrentYearCategories();
	});

	test.afterAll(async () => {
		await deletePreviousYearDeclaration();
	});

	test("button is hidden when no previous year declaration exists", async ({
		page,
	}) => {
		await deletePreviousYearDeclaration();
		await goToStep5(page);

		await expect(
			page.getByRole("button", {
				name: /reprendre les catégories/i,
			}),
		).not.toBeVisible();
	});

	test("button appears when previous year declaration exists", async ({
		page,
	}) => {
		await insertPreviousYearDeclaration();
		await goToStep5(page);

		await expect(
			page.getByRole("button", {
				name: /reprendre les catégories/i,
			}),
		).toBeVisible();
	});

	test("imports categories with names and details, numeric fields empty", async ({
		page,
	}) => {
		await goToStep5(page);

		// Click the import button — no existing data, so no confirmation needed
		await page
			.getByRole("button", { name: /reprendre les catégories/i })
			.click();

		// Verify source was set
		await expect(
			page.getByRole("combobox", {
				name: /source utilisée/i,
			}),
		).toHaveValue("convention-collective");

		// Verify 3 categories were imported
		await expect(page.getByText("Nombre de catégories : 3")).toBeVisible();

		// Verify category names in accordion headings
		await expect(
			page.getByRole("button", { name: /Cadres dirigeants/ }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Ingénieurs et cadres/ }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Techniciens/ }),
		).toBeVisible();

		// Open first category and verify detail is filled but numeric fields are empty
		await page.getByRole("button", { name: /Cadres dirigeants/ }).click();

		const detailInput = page.locator("#cat-0-detail");
		await expect(detailInput).toHaveValue("Directeurs et cadres supérieurs");

		// Verify numeric fields are empty
		await expect(
			page.getByRole("textbox", {
				name: "Effectif femmes, catégorie 1",
			}),
		).toHaveValue("");
		await expect(
			page.getByRole("textbox", {
				name: "Salaire de base annuel femmes, catégorie 1",
			}),
		).toHaveValue("");
	});

	test("shows confirmation dialog when form has existing data", async ({
		page,
	}) => {
		await goToStep5(page);

		// Type a name so the form has existing data
		await page.locator("#cat-0-name").fill("Catégorie existante");

		await page
			.getByRole("button", { name: /reprendre les catégories/i })
			.click();

		// Confirmation dialog should appear
		await expect(
			page.getByText(/catégories actuelles seront remplacées/),
		).toBeVisible();

		// Cancel should close dialog without changing data
		await page.getByRole("button", { name: "Annuler" }).click();

		// The manually typed category should still be there
		await expect(page.locator("#cat-0-name")).toHaveValue(
			"Catégorie existante",
		);
	});

	test("confirm replaces categories in dialog", async ({ page }) => {
		await goToStep5(page);

		// Type a name so the form has existing data
		await page.locator("#cat-0-name").fill("À remplacer");

		// Click import — should show confirmation since form has data
		await page
			.getByRole("button", { name: /reprendre les catégories/i })
			.click();
		await expect(
			page.getByText(/catégories actuelles seront remplacées/),
		).toBeVisible();

		// Confirm
		await page.getByRole("button", { name: "Reprendre", exact: true }).click();

		// Should now have 3 categories from previous year, not the manual one
		await expect(page.getByText("Nombre de catégories : 3")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Cadres dirigeants/ }),
		).toBeVisible();
	});
});

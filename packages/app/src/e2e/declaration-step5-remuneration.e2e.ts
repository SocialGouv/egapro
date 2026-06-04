import { expect, type Page, test } from "@playwright/test";
import {
	deleteCurrentYearCategories,
	resetDeclarationToDraft,
} from "./helpers/db";

async function goToStep5(page: Page) {
	await page.goto("/declaration-remuneration");
	await page.waitForURL("**/declaration-remuneration/etape/**");
	await page.goto("/declaration-remuneration/etape/5");
	await page.waitForURL("**/declaration-remuneration/etape/5");
	await expect(page.getByText("Étape 5 sur 6")).toBeVisible();
}

test.describe("Step 5 — Remuneration by category", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await deleteCurrentYearCategories();
	});

	test("title does not contain '(salaire de base et primes)'", async ({
		page,
	}) => {
		await goToStep5(page);
		const heading = page.getByRole("heading", {
			name: /Écart de rémunération par catégories de salariés/,
		});
		await expect(heading).toBeVisible();
		await expect(heading).not.toContainText("salaire de base et primes");
	});

	test("import button uses the file-download icon", async ({ page }) => {
		await goToStep5(page);
		const importButton = page.getByRole("button", {
			name: "Importer les données",
		});
		await expect(importButton).toBeVisible();
		await expect(importButton).toHaveClass(/fr-icon-file-download-line/);
		await expect(importButton).not.toHaveClass(/fr-icon-upload-line/);
	});

	test("adding a category moves focus to the new accordion header", async ({
		page,
	}) => {
		await goToStep5(page);
		const addButton = page.getByRole("button", {
			name: "Ajouter une catégorie d'emplois",
		});
		await addButton.click();
		const newCategoryHeader = page.getByRole("button", {
			name: /Catégorie d'emplois n°2/,
		});
		await expect(newCategoryHeader).toBeFocused();
		await expect(newCategoryHeader).toHaveAttribute("aria-expanded", "true");
	});

	test("euro inputs display amounts with a thousand separator", async ({
		page,
	}) => {
		await goToStep5(page);
		const amountInput = page.getByRole("textbox", {
			name: "Salaire de base annuel femmes, catégorie 1",
		});
		await amountInput.fill("1234567");
		await amountInput.blur();
		const value = await amountInput.inputValue();
		expect(value).toContain(",");
		expect(value.replace(/\s/g, "")).toBe("1234567,00");

		// The full 7-figure amount must stay visible: with the trimmed horizontal
		// padding "1 234 567,00" fits the field without being clipped (no overflow).
		await page.evaluate(() => document.fonts.ready);
		const overflow = await amountInput.evaluate(
			(el) => el.scrollWidth - el.clientWidth,
		);
		expect(overflow).toBeLessThanOrEqual(1);
	});

	test("remuneration fields and units are right-aligned in their column", async ({
		page,
	}) => {
		await goToStep5(page);
		const layout = await page.evaluate(() => {
			const fieldOf = (label: string) =>
				document.querySelector(`[aria-label="${label}"]`);
			const baseInput = fieldOf("Salaire de base annuel femmes, catégorie 1");
			const variableInput = fieldOf(
				"Composantes variables annuelles femmes, catégorie 1",
			);
			const cell = baseInput?.parentElement;
			const baseUnit = baseInput?.nextElementSibling;
			const variableUnit = variableInput?.nextElementSibling;
			if (!baseInput || !cell || !baseUnit || !variableUnit) return null;
			return {
				justify: getComputedStyle(cell).justifyContent,
				textAlign: getComputedStyle(baseInput).textAlign,
				baseUnitRight: baseUnit.getBoundingClientRect().right,
				variableUnitRight: variableUnit.getBoundingClientRect().right,
			};
		});

		expect(layout).not.toBeNull();
		if (!layout) return;
		// The number is right-aligned and the field + unit are pushed to the right
		// of the cell, matching the right-aligned Total values.
		expect(layout.textAlign).toBe("right");
		expect(layout.justify).toBe("flex-end");
		// The € units therefore line up vertically from one row to the next.
		expect(
			Math.abs(layout.baseUnitRight - layout.variableUnitRight),
		).toBeLessThanOrEqual(1);
	});
});

import { expect, test } from "@playwright/test";
import { resetDeclarationToDraft } from "./helpers/db";

test.describe("Step 1 workforce — Bug #3527", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
	});

	test.beforeEach(async ({ page }) => {
		await page.goto("/declaration-remuneration");
		await page.waitForURL("**/declaration-remuneration/etape/1");
	});

	test("Bug 1 — clearing one field blocks navigation and shows field-level error", async ({
		page,
	}) => {
		const womenInput = page.getByRole("textbox", { name: "Nombre de femmes" });
		const menInput = page.getByRole("textbox", { name: "Nombre d'hommes" });

		await womenInput.fill("10");
		await menInput.fill("15");
		await page.getByRole("button", { name: "Suivant" }).click();
		await page.waitForURL("**/declaration-remuneration/etape/2");

		await page.goto("/declaration-remuneration/etape/1");
		await page.waitForURL("**/declaration-remuneration/etape/1");

		await womenInput.clear();

		await page.getByRole("button", { name: "Suivant" }).click();

		await expect(page).toHaveURL(/etape\/1/);

		await expect(page.locator(".fr-error-text").first()).toBeVisible();
	});

	test("Bug 1 — entering 0 explicitly is allowed and passes validation", async ({
		page,
	}) => {
		const womenInput = page.getByRole("textbox", { name: "Nombre de femmes" });
		const menInput = page.getByRole("textbox", { name: "Nombre d'hommes" });

		await womenInput.fill("0");
		await menInput.fill("20");

		await page.getByRole("button", { name: "Suivant" }).click();

		await expect(page).toHaveURL(/etape\/2/);
	});
});

import { expect, test } from "@playwright/test";

import { setCompanyHasCse, setUserPhone } from "./helpers/db";
import { loginWithProConnect } from "./helpers/login";

test.describe("Missing info modal", () => {
	test.describe.configure({ mode: "serial" });
	test.setTimeout(90_000);

	test.describe("CSE only (phone already set)", () => {
		test.beforeAll(async () => {
			await setUserPhone("0122334455");
			await setCompanyHasCse(null);
		});

		test.afterAll(async () => {
			await setCompanyHasCse(true);
		});

		test("opens modal and submits CSE choice", async ({ page }) => {
			// Re-login so session JWT picks up phone from DB
			await page.context().clearCookies();
			await loginWithProConnect(page);

			const modal = page.locator("#missing-info-modal");

			const declarationButton = page.getByRole("button", {
				name: "Rémunération",
			});
			await expect(declarationButton).toBeVisible();
			await declarationButton.click();

			await expect(modal).toHaveAttribute("open");
			await expect(
				modal.getByText("Un CSE a-t-il été mis en place"),
			).toBeVisible();

			await modal.locator("label[for='missing-info-cse-yes']").click();
			await modal.getByRole("button", { name: "Enregistrer" }).click();

			await page.waitForURL("**/declaration-remuneration**", {
				timeout: 10_000,
			});
		});
	});

	test.describe("Phone only (CSE already set)", () => {
		test.beforeAll(async () => {
			await setUserPhone(null);
			await setCompanyHasCse(true);
		});

		test.afterAll(async () => {
			await setUserPhone("0122334455");
		});

		test("opens modal and submits phone number", async ({ page }) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);

			const modal = page.locator("#missing-info-modal");

			const declarationButton = page.getByRole("button", {
				name: "Rémunération",
			});
			await expect(declarationButton).toBeVisible();
			await declarationButton.click();

			await expect(modal).toHaveAttribute("open");
			await expect(modal.getByLabel(/Numéro de téléphone/)).toBeVisible();

			await modal.getByLabel(/Numéro de téléphone/).fill("01 22 33 44 55");
			await modal.getByRole("button", { name: "Enregistrer" }).click();

			await page.waitForURL("**/declaration-remuneration**", {
				timeout: 10_000,
			});
		});
	});

	test.describe("Validation error on empty phone", () => {
		test.beforeAll(async () => {
			await setUserPhone(null);
			await setCompanyHasCse(true);
		});

		test.afterAll(async () => {
			await setUserPhone("0122334455");
		});

		test("shows validation error when phone is empty", async ({ page }) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);

			const modal = page.locator("#missing-info-modal");

			const declarationButton = page.getByRole("button", {
				name: "Rémunération",
			});
			await expect(declarationButton).toBeVisible();
			await declarationButton.click();

			await expect(modal).toHaveAttribute("open");

			await modal.getByRole("button", { name: "Enregistrer" }).click();

			await expect(modal.getByText("Format attendu")).toBeVisible();
			expect(page.url()).toContain("/mon-espace");
		});
	});
});

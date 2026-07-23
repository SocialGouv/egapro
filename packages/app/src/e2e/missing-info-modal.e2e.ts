import { expect, test } from "@playwright/test";

import { setCompanyHasCse, setUserPhone } from "./helpers/db";
import { clickAndExpectDialogOpen, waitForDsfrModal } from "./helpers/dsfr";
import { loginWithProConnect } from "./helpers/login";

const MISSING_INFO_MODAL_ID = "missing-info-modal";

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
			await waitForDsfrModal(page, MISSING_INFO_MODAL_ID);

			const modal = page.locator(`#${MISSING_INFO_MODAL_ID}`);

			const declarationButton = page.getByRole("button", {
				name: "Rémunération",
			});
			await expect(declarationButton).toBeVisible();
			await clickAndExpectDialogOpen(
				page,
				declarationButton,
				MISSING_INFO_MODAL_ID,
			);
			await expect(
				modal.getByText("Un CSE a-t-il été mis en place"),
			).toBeVisible();

			await modal.locator("label[for='missing-info-cse-yes']").click();
			await modal.getByRole("button", { name: "Enregistrer" }).click();

			// After save for remuneration, the declaration process panel opens
			const panel = page.locator("#declaration-process-panel");
			await expect(panel).toHaveAttribute("open", { timeout: 10_000 });
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
			await waitForDsfrModal(page, MISSING_INFO_MODAL_ID);

			const modal = page.locator(`#${MISSING_INFO_MODAL_ID}`);

			const declarationButton = page.getByRole("button", {
				name: "Rémunération",
			});
			await expect(declarationButton).toBeVisible();
			await clickAndExpectDialogOpen(
				page,
				declarationButton,
				MISSING_INFO_MODAL_ID,
			);
			await expect(modal.getByLabel(/Numéro de téléphone/)).toBeVisible();

			await modal.getByLabel(/Numéro de téléphone/).fill("01 22 33 44 55");
			await modal.getByRole("button", { name: "Enregistrer" }).click();

			// After save for remuneration, the declaration process panel opens
			const panel = page.locator("#declaration-process-panel");
			await expect(panel).toHaveAttribute("open", { timeout: 10_000 });
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
			await waitForDsfrModal(page, MISSING_INFO_MODAL_ID);

			const modal = page.locator(`#${MISSING_INFO_MODAL_ID}`);

			const declarationButton = page.getByRole("button", {
				name: "Rémunération",
			});
			await expect(declarationButton).toBeVisible();
			await clickAndExpectDialogOpen(
				page,
				declarationButton,
				MISSING_INFO_MODAL_ID,
			);

			await modal.getByRole("button", { name: "Enregistrer" }).click();

			await expect(
				modal.locator(".fr-message--error", { hasText: "Format attendu" }),
			).toBeVisible();
			expect(page.url()).toContain("/mon-espace");
		});
	});

	test.describe("Validation error on empty CSE", () => {
		test.beforeAll(async () => {
			await setUserPhone("0122334455");
			await setCompanyHasCse(null);
		});

		test.afterAll(async () => {
			await setCompanyHasCse(true);
		});

		test("shows explicit French error when CSE choice is empty", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);
			await waitForDsfrModal(page, MISSING_INFO_MODAL_ID);

			const modal = page.locator(`#${MISSING_INFO_MODAL_ID}`);

			const declarationButton = page.getByRole("button", {
				name: "Rémunération",
			});
			await expect(declarationButton).toBeVisible();
			await clickAndExpectDialogOpen(
				page,
				declarationButton,
				MISSING_INFO_MODAL_ID,
			);
			await expect(
				modal.getByText("Un CSE a-t-il été mis en place"),
			).toBeVisible();

			await modal.getByRole("button", { name: "Enregistrer" }).click();

			// Regression guard for #3970: an unanswered CSE radio must surface the
			// explicit French message, not Zod's default "Invalid input: expected
			// boolean, received null".
			await expect(
				modal.locator(".fr-message--error", {
					hasText: "Veuillez renseigner si un CSE a été mis en place.",
				}),
			).toBeVisible();
			expect(page.url()).toContain("/mon-espace");
		});
	});
});

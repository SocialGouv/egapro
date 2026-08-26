import { expect, test } from "@playwright/test";

import { TEST_USER_PHONE } from "./constants";
import {
	resetDeclarationToDraft,
	resetGipWorkforce,
	setCompanyHasCse,
	setDeclarationComplianceState,
	setUserPhone,
} from "./helpers/db";
import { clickAndExpectDialogOpen, waitForDsfrModal } from "./helpers/dsfr";
import { loginWithProConnect } from "./helpers/login";

const MISSING_INFO_MODAL_ID = "missing-info-modal";

test.describe("Missing info modal", () => {
	test.describe.configure({ mode: "serial" });
	test.setTimeout(90_000);

	test.describe("CSE only (phone already set)", () => {
		test.beforeAll(async () => {
			await setUserPhone(TEST_USER_PHONE);
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
			await setUserPhone(TEST_USER_PHONE);
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
			await setUserPhone(TEST_USER_PHONE);
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
				modal.locator(".fr-message--error", {
					hasText: "Veuillez renseigner votre numéro de téléphone",
				}),
			).toBeVisible();
			expect(page.url()).toContain("/mon-espace");
		});
	});

	test.describe("Phone and CSE missing → reopening stays on the process panel", () => {
		test.beforeAll(async () => {
			await setUserPhone(null);
			await setCompanyHasCse(null);
		});

		test.afterAll(async () => {
			await setUserPhone(TEST_USER_PHONE);
			await setCompanyHasCse(true);
		});

		// Regression guard for #4056: after saving phone + CSE from the missing-info
		// modal, the server-injected props of the "Rémunération" link must be
		// refreshed (router.refresh) so a later click opens the process panel and no
		// longer re-opens an empty missing-info modal.
		test("save then reopen opens the process panel, not the empty modal", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);
			await waitForDsfrModal(page, MISSING_INFO_MODAL_ID);

			const modal = page.locator(`#${MISSING_INFO_MODAL_ID}`);
			const panel = page.locator("#declaration-process-panel");
			const remuButton = page.getByRole("button", { name: "Rémunération" });

			await clickAndExpectDialogOpen(page, remuButton, MISSING_INFO_MODAL_ID);
			await expect(modal.getByLabel(/Numéro de téléphone/)).toBeVisible();
			await expect(
				modal.getByText("Un CSE a-t-il été mis en place"),
			).toBeVisible();

			await modal.getByLabel(/Numéro de téléphone/).fill("01 22 33 44 55");
			await modal.locator("label[for='missing-info-cse-yes']").click();
			await modal.getByRole("button", { name: "Enregistrer" }).click();

			await expect(panel).toHaveAttribute("open", { timeout: 10_000 });

			// router.refresh() reinvalidates the RSC tree so the link stops pointing
			// at the missing-info modal — the direct, observable effect of the #4056
			// fix. Without it this attribute would stay "missing-info-modal" forever.
			await expect(remuButton).toHaveAttribute(
				"aria-controls",
				"declaration-process-panel",
				{ timeout: 10_000 },
			);

			await panel.getByRole("button", { name: "Fermer" }).click();
			await expect(panel).not.toHaveAttribute("open", { timeout: 10_000 });

			await clickAndExpectDialogOpen(
				page,
				remuButton,
				"declaration-process-panel",
			);
			await expect(modal).not.toHaveAttribute("open");
		});
	});

	test.describe("Validation error on empty CSE", () => {
		test.beforeAll(async () => {
			await setUserPhone(TEST_USER_PHONE);
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

	// Regression guard for #3952: the phone + CSE prerequisites were only enforced by
	// the "Rémunération" link of Mon espace, so every other way in — the home CTA, a
	// bookmark, a deep link, a callbackUrl coming back from ProConnect — walked
	// straight into the funnel and skipped the modal above entirely. The guard now
	// sits on the funnel layout, so it holds whatever the entry point.
	test.describe("Entering the funnel outside Mon espace (#3952)", () => {
		test.beforeAll(async () => {
			await resetGipWorkforce();
			// Not a draft: the read-only recap asserted below only renders for a
			// declaration that reached the compliance stage.
			await setDeclarationComplianceState({
				currentStep: 6,
				status: "awaiting_compliance_path_choice",
			});
			await setUserPhone(null);
			await setCompanyHasCse(null);
		});

		test.afterAll(async () => {
			await setUserPhone(TEST_USER_PHONE);
			await setCompanyHasCse(true);
			await resetDeclarationToDraft();
		});

		test("a direct URL lands on Mon espace until both prerequisites are answered", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);

			await test.step("neither answered — the funnel entry point bounces", async () => {
				await page.goto("/declaration-remuneration");
				await page.waitForURL("**/mon-espace");
				// Bounced, but not into a dead end: the modal that collects both is right there.
				await waitForDsfrModal(page, MISSING_INFO_MODAL_ID);
			});

			await test.step("a deep link into a later step bounces too", async () => {
				await page.goto("/declaration-remuneration/etape/4");
				await page.waitForURL("**/mon-espace");
			});

			// The guard sits on the (with-banner) group, not on the funnel root, so the
			// read-only recap stays readable — a colleague who never filled the funnel in
			// must still be able to consult what the company declared.
			await test.step("the read-only recap stays outside the guard", async () => {
				await page.goto("/declaration-remuneration/recapitulatif");
				await expect(
					page.getByRole("heading", {
						level: 1,
						name: /Déclaration des indicateurs de rémunération/,
					}),
				).toBeVisible();
			});

			await test.step("the phone alone is not enough above the CSE threshold", async () => {
				await setUserPhone(TEST_USER_PHONE);
				await page.goto("/declaration-remuneration");
				await page.waitForURL("**/mon-espace");
			});

			await test.step("both answered — the same deep link now opens the funnel", async () => {
				await setCompanyHasCse(true);
				await page.goto("/declaration-remuneration/etape/4");
				await page.waitForURL("**/declaration-remuneration/etape/4");
				await expect(page.getByText("Étape 4 sur 6")).toBeVisible();
			});
		});
	});
});

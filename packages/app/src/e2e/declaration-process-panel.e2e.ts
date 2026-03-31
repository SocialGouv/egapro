import { expect, test } from "@playwright/test";

import {
	deleteCseOpinions,
	deleteJointEvaluationFiles,
	insertCseOpinion,
	insertJointEvaluationFile,
	resetDeclarationToDraft,
	setCompanyHasCse,
	setDeclarationComplianceState,
	setUserPhone,
} from "./helpers/db";
import { loginWithProConnect } from "./helpers/login";

const PANEL_ID = "declaration-process-panel";
const CURRENT_YEAR = 2026;

test.describe("Declaration process panel", () => {
	test.describe.configure({ mode: "serial" });
	test.setTimeout(90_000);

	test.afterAll(async () => {
		await resetDeclarationToDraft();
		await deleteJointEvaluationFiles();
		await deleteCseOpinions();
		await setCompanyHasCse(true);
		await setUserPhone("0122334455");
	});

	test.describe("Variant: start (declaration not submitted)", () => {
		test.beforeAll(async () => {
			await resetDeclarationToDraft();
			await setCompanyHasCse(true);
			await setUserPhone("0122334455");
		});

		test("shows start variant with info alert and step 1 current", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);

			const panel = page.locator(`#${PANEL_ID}`);
			const remuButton = page.getByRole("button", { name: "Rémunération" });
			await expect(remuButton.first()).toBeVisible();
			await remuButton.first().click();

			await expect(panel).toHaveAttribute("open", { timeout: 10_000 });
			await expect(
				panel.getByText(
					`Démarche des indicateurs de rémunération ${CURRENT_YEAR}`,
				),
			).toBeVisible();
			await expect(
				panel.getByText("Vous devez au préalable disposer"),
			).toBeVisible();
			await expect(
				panel.getByText("Déclaration des indicateurs de rémunération"),
			).toBeVisible();
			await expect(
				panel.getByText("Indicateurs pré-remplis à vérifier"),
			).toBeVisible();
			await expect(
				panel.getByRole("link", { name: "Commencer la déclaration" }),
			).toBeVisible();
		});
	});

	test.describe("Variant: compliance (corrective action, second decl not done)", () => {
		test.beforeAll(async () => {
			await setDeclarationComplianceState({
				compliancePath: "corrective_action",
			});
		});

		test("shows compliance variant with step 1 complete, step 2 current", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);

			const panel = page.locator(`#${PANEL_ID}`);
			await page.getByRole("button", { name: "Rémunération" }).first().click();

			await expect(panel).toHaveAttribute("open", { timeout: 10_000 });
			await expect(
				panel.getByText("Votre déclaration a été transmise"),
			).toBeVisible();
			await expect(
				panel.getByText("Actions correctives et seconde déclaration"),
			).toBeVisible();
		});
	});

	test.describe("Variant: evaluation (joint_evaluation path, file not uploaded)", () => {
		test.beforeAll(async () => {
			await setDeclarationComplianceState({
				compliancePath: "joint_evaluation",
			});
			await deleteJointEvaluationFiles();
		});

		test("shows evaluation variant with evaluation conjointe bullet", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);

			const panel = page.locator(`#${PANEL_ID}`);
			await page.getByRole("button", { name: "Rémunération" }).first().click();

			await expect(panel).toHaveAttribute("open", { timeout: 10_000 });
			await expect(
				panel.getByText("Évaluation conjointe des rémunérations"),
			).toBeVisible();

			const ctaLink = panel.getByRole("link", {
				name: "Commencer la déclaration",
			});
			await expect(ctaLink).toHaveAttribute("href", /evaluation-conjointe/);
		});
	});

	test.describe("Variant: cse (joint evaluation file uploaded)", () => {
		test.beforeAll(async () => {
			await setDeclarationComplianceState({
				compliancePath: "joint_evaluation",
			});
			await insertJointEvaluationFile(CURRENT_YEAR);
		});

		test("shows cse variant with CSE deposit step", async ({ page }) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);

			const panel = page.locator(`#${PANEL_ID}`);
			await page.getByRole("button", { name: "Rémunération" }).first().click();

			await expect(panel).toHaveAttribute("open", { timeout: 10_000 });
			await expect(
				panel.getByText("Déposer le ou les avis du CSE"),
			).toBeVisible();

			const ctaLink = panel.getByRole("link", {
				name: "Commencer la déclaration",
			});
			await expect(ctaLink).toHaveAttribute("href", /avis-cse/);
		});
	});

	test.describe("Variant: closed (compliance completed + CSE deposited)", () => {
		test.beforeAll(async () => {
			await setDeclarationComplianceState({
				compliancePath: "joint_evaluation",
				complianceCompletedAt: new Date(),
			});
			await insertJointEvaluationFile(CURRENT_YEAR);
			await insertCseOpinion(CURRENT_YEAR);
		});

		test("shows closed variant with démarche close message", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);

			const panel = page.locator(`#${PANEL_ID}`);
			await page.getByRole("button", { name: "Rémunération" }).first().click();

			await expect(panel).toHaveAttribute("open", { timeout: 10_000 });
			await expect(panel.getByText("Démarche close")).toBeVisible();
			await expect(
				panel.getByText(
					"Cette démarche est terminée, aucune modification n'est possible.",
				),
			).toBeVisible();
		});
	});

	test.describe("Opens after missing info modal save", () => {
		test.beforeAll(async () => {
			await resetDeclarationToDraft();
			await setCompanyHasCse(null);
			await setUserPhone("0122334455");
		});

		test.afterAll(async () => {
			await setCompanyHasCse(true);
		});

		test("missing info modal save opens the panel for remuneration", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);

			const modal = page.locator("#missing-info-modal");
			const panel = page.locator(`#${PANEL_ID}`);

			await page.getByRole("button", { name: "Rémunération" }).first().click();
			await expect(modal).toHaveAttribute("open", { timeout: 10_000 });

			await modal.locator("label[for='missing-info-cse-yes']").click();
			await modal.getByRole("button", { name: "Enregistrer" }).click();

			await expect(panel).toHaveAttribute("open", { timeout: 10_000 });
			await expect(
				panel.getByText(
					`Démarche des indicateurs de rémunération ${CURRENT_YEAR}`,
				),
			).toBeVisible();
		});
	});
});

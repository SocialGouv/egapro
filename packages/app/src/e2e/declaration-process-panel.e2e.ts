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
import { clickAndExpectDialogOpen, waitForDsfrModal } from "./helpers/dsfr";
import { loginWithProConnect } from "./helpers/login";

// Per-variant panel rendering is covered by my-space/__tests__/DeclarationProcessPanel.test.tsx.

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

	test.describe("DB state → variant: closed (compliance completed + CSE deposited)", () => {
		test.beforeAll(async () => {
			await setDeclarationComplianceState({
				status: "demarche_completed",
				firstDeclarationPathChoice: "joint_evaluation",
				demarcheCompletedAt: new Date(),
				cseOpinionCompletedAt: new Date(),
			});
			await insertJointEvaluationFile(CURRENT_YEAR);
			await insertCseOpinion(CURRENT_YEAR);
		});

		test("shows closed variant with démarche close message", async ({
			page,
		}) => {
			await page.context().clearCookies();
			await loginWithProConnect(page);
			await waitForDsfrModal(page, PANEL_ID);

			const panel = page.locator(`#${PANEL_ID}`);
			const remuButton = page.getByRole("button", { name: "Rémunération" });
			await expect(remuButton.first()).toBeVisible();
			await clickAndExpectDialogOpen(page, remuButton.first(), PANEL_ID);

			await expect(panel.getByText("Démarche close")).toBeVisible();
			await expect(
				panel.getByText(
					"Cette démarche est terminée. Les avis du CSE restent modifiables jusqu'à l'échéance.",
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
			await waitForDsfrModal(page, PANEL_ID);

			const modal = page.locator("#missing-info-modal");
			const panel = page.locator(`#${PANEL_ID}`);

			const remuButton = page.getByRole("button", { name: "Rémunération" });
			await expect(remuButton.first()).toBeVisible();
			await clickAndExpectDialogOpen(
				page,
				remuButton.first(),
				"missing-info-modal",
			);

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

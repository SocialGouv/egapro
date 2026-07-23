import { expect, test } from "@playwright/test";

import {
	deleteCseOpinions,
	deleteJointEvaluationFiles,
	ensureCurrentYearDeclaration,
	insertCseOpinion,
	insertJointEvaluationFile,
	resetDeclarationToDraft,
	resetGipWorkforce,
	setCompanyHasCse,
	setDeclarationComplianceState,
	setGipWorkforce,
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

	// Regression #3939: a GIP-derived < 100 company without CSE must never see the
	// indicator-G path step nor the "déposer l'avis CSE" step — neither during the
	// démarche nor after completion (where the panel used to stay stuck on "avis CSE
	// en cours" with a /avis-cse CTA). Gating is driven by the GIP workforce (79 here),
	// not the WEEZ headcount or the has_cse flag.
	test.describe("GIP < 100 without CSE: indicator-G and CSE steps are hidden", () => {
		const STEP2_TITLE =
			"Parcours de mise en conformité pour l'indicateur par catégorie de salariés";
		const STEP3_TITLE = "Déposer le ou les avis du CSE";

		test.afterAll(async () => {
			await resetDeclarationToDraft();
			await resetGipWorkforce();
			await setCompanyHasCse(true);
		});

		async function openPanel(page: Parameters<typeof loginWithProConnect>[0]) {
			await page.context().clearCookies();
			await loginWithProConnect(page);
			await waitForDsfrModal(page, PANEL_ID);
			const remuButton = page.getByRole("button", { name: "Rémunération" });
			await expect(remuButton.first()).toBeVisible();
			await clickAndExpectDialogOpen(page, remuButton.first(), PANEL_ID);
		}

		test.describe("during the démarche (draft)", () => {
			test.beforeAll(async () => {
				await ensureCurrentYearDeclaration();
				await setGipWorkforce(79);
				await setCompanyHasCse(false);
				await setUserPhone("0122334455");
				await resetDeclarationToDraft();
			});

			test("only the declaration step is announced", async ({ page }) => {
				await openPanel(page);
				const panel = page.locator(`#${PANEL_ID}`);

				await expect(
					panel.getByText("Déclaration des indicateurs de rémunération"),
				).toBeVisible();
				await expect(panel.getByText(STEP2_TITLE)).toHaveCount(0);
				await expect(panel.getByText(STEP3_TITLE)).toHaveCount(0);
			});
		});

		test.describe("after completion (démarche_completed, not subject)", () => {
			test.beforeAll(async () => {
				await ensureCurrentYearDeclaration();
				await setGipWorkforce(79);
				await setCompanyHasCse(false);
				await setUserPhone("0122334455");
				await setDeclarationComplianceState({
					status: "demarche_completed",
					demarcheCompletedAt: new Date(),
				});
			});

			test("closed variant without any CSE deposit prompt or CTA", async ({
				page,
			}) => {
				await openPanel(page);
				const panel = page.locator(`#${PANEL_ID}`);

				await expect(panel.getByText("Démarche close")).toBeVisible();
				await expect(
					panel.getByText("Cette démarche est terminée.", { exact: true }),
				).toBeVisible();
				await expect(
					panel.getByText(
						"Cette démarche est terminée. Les avis du CSE restent modifiables jusqu'à l'échéance.",
					),
				).toHaveCount(0);
				await expect(panel.getByText(STEP3_TITLE)).toHaveCount(0);

				const cta = panel.getByRole("link", { name: "Voir la déclaration" });
				await expect(cta).toBeVisible();
				await expect(cta).not.toHaveAttribute("href", /avis-cse/);
			});
		});
	});
});

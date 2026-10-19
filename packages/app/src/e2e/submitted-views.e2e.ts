import { expect, test } from "@playwright/test";
import { getCurrentYear } from "~/modules/domain";
import {
	MY_SPACE,
	MY_SPACE_CSE_OPINION_VIEW,
	MY_SPACE_JOINT_EVALUATION_VIEW,
} from "~/modules/routes";
import {
	deleteCseOpinions,
	deleteJointEvaluationFiles,
	ensureCurrentYearDeclaration,
	insertCseOpinion,
	insertCseOpinionFile,
	insertJointEvaluationFile,
	markCseOpinionDraftUpdated,
	resetDeclarationToDraft,
	resetGipWorkforce,
	setCompanyHasCse,
	setDeclarationComplianceState,
	setGipWorkforce,
} from "./helpers/db";
import { insertJointEvaluationSubmission } from "./helpers/declaration-history";
import { clickAndExpectDialogOpen, waitForDsfrModal } from "./helpers/dsfr";

const YEAR = getCurrentYear();

test.describe("Submitted documents in Mon espace", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		await ensureCurrentYearDeclaration();
		await resetDeclarationToDraft();
		await deleteJointEvaluationFiles();
		await deleteCseOpinions();
		await setCompanyHasCse(true);
		await setGipWorkforce(120);
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
		await deleteJointEvaluationFiles();
		await deleteCseOpinions();
		await resetGipWorkforce();
	});

	test("unsubmitted documents are unavailable", async ({ page }) => {
		const jointResponse = await page.goto(MY_SPACE_JOINT_EVALUATION_VIEW);
		expect(jointResponse?.status()).toBe(404);

		const cseResponse = await page.goto(MY_SPACE_CSE_OPINION_VIEW);
		expect(cseResponse?.status()).toBe(404);
	});

	test("opens the submitted CSE opinions from the panel and the report directly", async ({
		page,
	}) => {
		await setDeclarationComplianceState({
			status: "demarche_completed",
			firstDeclarationPathChoice: "joint_evaluation",
			cseRequired: true,
			cseOpinionCompletedAt: new Date(),
			demarcheCompletedAt: new Date(),
		});
		await insertCseOpinion(YEAR);
		await insertCseOpinionFile(YEAR);
		await insertJointEvaluationFile(YEAR);
		await insertJointEvaluationSubmission(YEAR);

		await page.goto(MY_SPACE);
		await waitForDsfrModal(page, "declaration-process-panel");
		await clickAndExpectDialogOpen(
			page,
			page.getByRole("button", { name: "Rémunération" }).first(),
			"declaration-process-panel",
		);

		const panel = page.locator("#declaration-process-panel");
		await expect(panel.getByTitle("Voir les avis du CSE")).toBeVisible();

		await page.goto(MY_SPACE_JOINT_EVALUATION_VIEW);
		await expect(page).toHaveURL(
			new RegExp(`${MY_SPACE_JOINT_EVALUATION_VIEW}$`),
		);
		await expect(
			page.getByRole("heading", {
				name: `Évaluation conjointe des rémunérations ${YEAR}`,
				level: 1,
			}),
		).toBeVisible();

		await page.goto(MY_SPACE_CSE_OPINION_VIEW);
		await expect(
			page.getByRole("heading", { name: /Avis du CSE pour la déclaration/ }),
		).toBeVisible();
		await expect(page.getByText("Fichiers transmis")).toBeVisible();
		await expect(
			page.getByRole("link", { name: "Télécharger avis-cse.pdf" }),
		).toBeVisible();
		await page.getByRole("link", { name: "Mon espace" }).last().click();
		await expect(page).toHaveURL(new RegExp(`${MY_SPACE}$`));
	});

	test("hides opinions modified since their last transmission", async ({
		page,
	}) => {
		await markCseOpinionDraftUpdated(YEAR);
		const response = await page.goto(MY_SPACE_CSE_OPINION_VIEW);
		expect(response?.status()).toBe(404);

		await page.goto(MY_SPACE);
		await waitForDsfrModal(page, "declaration-process-panel");
		await clickAndExpectDialogOpen(
			page,
			page.getByRole("button", { name: "Rémunération" }).first(),
			"declaration-process-panel",
		);
		await expect(
			page
				.locator("#declaration-process-panel")
				.getByTitle("Voir les avis du CSE"),
		).toHaveCount(0);
	});
});

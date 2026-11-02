import { expect, test } from "@playwright/test";
import { getCurrentYear } from "~/modules/domain";
import {
	API_CSE_OPINION_PDF,
	API_JOINT_EVALUATION_PDF,
	MY_SPACE,
	MY_SPACE_CSE_OPINION_VIEW,
	MY_SPACE_JOINT_EVALUATION_VIEW,
} from "~/modules/routes";
import { TEST_SIREN } from "./constants";
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
const JOINT_EVALUATION_RECAP_HREF = `${API_JOINT_EVALUATION_PDF}?year=${YEAR}`;
const CSE_OPINION_RECAP_HREF = `${API_CSE_OPINION_PDF}?year=${YEAR}`;

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

		const recapResponse = await page.request.get(JOINT_EVALUATION_RECAP_HREF);
		expect(recapResponse.status()).toBe(404);

		const cseRecapResponse = await page.request.get(CSE_OPINION_RECAP_HREF);
		expect(cseRecapResponse.status()).toBe(404);
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
		await expect(
			page.getByRole("link", {
				name: "Télécharger le récapitulatif de l'évaluation conjointe des rémunérations (PDF)",
			}),
		).toHaveAttribute("href", JOINT_EVALUATION_RECAP_HREF);
		const recapResponse = await page.request.get(JOINT_EVALUATION_RECAP_HREF, {
			timeout: 30_000,
		});
		expect(recapResponse.status()).toBe(200);
		expect(recapResponse.headers()["content-type"]).toContain("pdf");
		expect(recapResponse.headers()["content-disposition"]).toContain(
			`evaluation-conjointe-${TEST_SIREN}-${YEAR}.pdf`,
		);

		await page.goto(MY_SPACE_CSE_OPINION_VIEW);
		await expect(
			page.getByRole("heading", {
				name: `Transmission du ou des avis du CSE ${YEAR}`,
				level: 1,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Première déclaration" }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Seconde déclaration" }),
		).toHaveCount(0);
		await expect(
			page.getByRole("columnheader", { name: "Fichier(s) déposé(s)" }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: /^avis-cse\.pdf/ }),
		).toBeVisible();
		await expect(
			page.getByRole("link", {
				name: "Télécharger le récapitulatif de la transmission du ou des avis du CSE (PDF)",
			}),
		).toHaveAttribute("href", CSE_OPINION_RECAP_HREF);
		const cseRecapResponse = await page.request.get(CSE_OPINION_RECAP_HREF, {
			timeout: 30_000,
		});
		expect(cseRecapResponse.status()).toBe(200);
		expect(cseRecapResponse.headers()["content-type"]).toContain("pdf");
		expect(cseRecapResponse.headers()["content-disposition"]).toContain(
			`avis-cse-${TEST_SIREN}-${YEAR}.pdf`,
		);
		await page.getByRole("link", { name: "Mon espace" }).last().click();
		await expect(page).toHaveURL(new RegExp(`${MY_SPACE}$`));
	});

	test("hides opinions modified since their last transmission", async ({
		page,
	}) => {
		await markCseOpinionDraftUpdated(YEAR);
		const response = await page.goto(MY_SPACE_CSE_OPINION_VIEW);
		expect(response?.status()).toBe(404);
		const recapResponse = await page.request.get(CSE_OPINION_RECAP_HREF);
		expect(recapResponse.status()).toBe(404);

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

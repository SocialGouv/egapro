import { expect, type Page, test } from "@playwright/test";
import { getCurrentYear } from "~/modules/domain";
import {
	COMPLIANCE_CONFIRMATION,
	COMPLIANCE_JOINT_EVALUATION,
	COMPLIANCE_PATH,
	complianceStepHref,
	cseOpinionStepHref,
	MY_SPACE_JOINT_EVALUATION_VIEW,
	mySpaceHistoryHref,
} from "~/modules/routes";
import { TEST_SIREN, TEST_USER_PHONE } from "./constants";
import {
	completeSecondDeclaration,
	fillCseStep1,
	selectCompliancePath,
	submitCseStep2,
	uploadJointEvalPdf,
} from "./helpers/compliance-flows";
import {
	countPathChoiceEventsRound1,
	deleteJointEvaluationFiles,
	lastPathChoiceValueRound1,
	pushCampaignDeadlinesFarFuture,
	resetDeclarationToDraft,
	resetGipWorkforce,
	setCompanyHasCse,
	setUserPhone,
} from "./helpers/db";
import { setCampaignDeadlines } from "./helpers/db-campaign";
import { completeDeclaration } from "./helpers/declaration-flows";
import { openPanneauDemarche, transmittedRow } from "./helpers/process-panel";
import { urlGlob } from "./helpers/routes";

// Epic #5128 — the last step a démarche transmitted on stays editable until the
// next campaign. One test per terminal deposit, plus the two non-regressions the
// epic calls out: a CSE closes everything but its opinion, and a stale deadline
// gates nothing.
const testDeclarationYear = getCurrentYear();

const JOINT_REPORT_ROW =
	"Votre rapport de l'évaluation conjointe a été transmis";
const SECOND_DECLARATION_ROW = "Votre seconde déclaration a été transmise";
const PATH_CHOICE_ROW = "Votre choix de parcours a été transmis";
const CSE_OPINION_ROW = "Vos avis du CSE ont été transmis";
const CLOSED_MENTION = "Modifiable jusqu'à la nouvelle campagne";
const CSE_CLOSED_MESSAGE =
	"Cette démarche est terminée. Vos avis du CSE restent modifiables.";

const PAST_DEADLINES = {
	decl1ModificationDeadline: "2020-06-01",
	decl1JustificationDeadline: "2020-06-01",
	decl1JointEvaluationDeadline: "2020-08-01",
	decl2ModificationDeadline: "2020-12-01",
	decl2JustificationDeadline: "2020-12-01",
	decl2JointEvaluationDeadline: "2021-01-01",
	decl2CseOpinionDeadline: "2021-02-01",
} as const;

async function expectClosedDemarche(page: Page, message: string) {
	await test.step("panneau « Mon espace » — démarche close", async () => {
		const panel = await openPanneauDemarche(page);
		await expect(panel.getByText("Démarche close")).toBeVisible();
		await expect(panel.getByText(message)).toBeVisible();
	});
}

async function expectRowModifiable(
	page: Page,
	label: string,
	options: { modifiable: boolean; closedMention?: boolean },
) {
	await test.step(`panneau « Mon espace » — ${label}`, async () => {
		const row = transmittedRow(page, label);
		await expect(row).toBeVisible();
		const modify = row.getByRole("link", { name: "Modifier", exact: true });
		if (options.modifiable) {
			await expect(modify).toBeVisible();
			// The CSE row bears no mention: its modification window is the opinion
			// itself, not the campaign.
			if (options.closedMention !== false) {
				await expect(
					row.getByText(CLOSED_MENTION, { exact: true }),
				).toBeVisible();
			}
		} else {
			await expect(modify).toHaveCount(0);
		}
	});
}

test.describe("The last transmitted step stays modifiable (epic #5128)", () => {
	test.beforeEach(async () => {
		await resetDeclarationToDraft();
		await deleteJointEvaluationFiles();
		await resetGipWorkforce();
		await pushCampaignDeadlinesFarFuture(testDeclarationYear);
		await setUserPhone(TEST_USER_PHONE);
	});

	test.afterAll(async () => {
		await pushCampaignDeadlinesFarFuture(testDeclarationYear);
		await resetDeclarationToDraft();
		await deleteJointEvaluationFiles();
		await setCompanyHasCse(true);
	});

	test("S1 — le rapport d'évaluation conjointe: modifié, il fait foi et reste la dernière transmission", async ({
		page,
	}) => {
		test.setTimeout(300_000);
		await setCompanyHasCse(false);

		await test.step("démarche close sur le rapport d'évaluation conjointe", async () => {
			await completeDeclaration(page, { hasGap: true });
			await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });
			await selectCompliancePath(page, "path-joint");
			await uploadJointEvalPdf(page);
			await page.waitForURL(urlGlob(COMPLIANCE_CONFIRMATION), {
				timeout: 15_000,
			});
		});

		await expectClosedDemarche(
			page,
			"Cette démarche est terminée. Votre rapport de l'évaluation conjointe reste modifiable.",
		);
		await expectRowModifiable(page, JOINT_REPORT_ROW, { modifiable: true });

		await test.step("re-transmission du rapport depuis Mon espace", async () => {
			await transmittedRow(page, JOINT_REPORT_ROW)
				.getByRole("link", { name: "Modifier", exact: true })
				.click();
			await page.waitForURL(urlGlob(COMPLIANCE_JOINT_EVALUATION), {
				timeout: 15_000,
			});
			await uploadJointEvalPdf(page, { fileName: "rapport-conjoint-v2.pdf" });
			await page.waitForURL(urlGlob(COMPLIANCE_CONFIRMATION), {
				timeout: 15_000,
			});
		});

		await test.step("la démarche reste close et le nouveau fichier fait foi", async () => {
			await expectClosedDemarche(
				page,
				"Cette démarche est terminée. Votre rapport de l'évaluation conjointe reste modifiable.",
			);
			await page.goto(MY_SPACE_JOINT_EVALUATION_VIEW);
			await expect(
				page.getByRole("link", { name: /rapport-conjoint-v2\.pdf/ }),
			).toBeVisible();
		});

		await test.step("l'historique conserve les deux dépôts", async () => {
			await page.goto(mySpaceHistoryHref(TEST_SIREN, testDeclarationYear));
			// The history row shows the event's page, not its label: two rows
			// pointing at the joint evaluation page prove the second deposit was
			// recorded as a new event rather than overwriting the first.
			await expect(
				page.getByRole("link", { name: "Évaluation conjointe", exact: true }),
			).toHaveCount(2);
		});
	});

	test("S2 — une seconde déclaration re-transmise avec un écart ≥ 5 % rouvre le choix du parcours", async ({
		page,
	}) => {
		test.setTimeout(300_000);
		await setCompanyHasCse(false);

		await test.step("seconde déclaration avec écart persistant", async () => {
			await completeDeclaration(page, { hasGap: true });
			await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });
			await selectCompliancePath(page, "path-corrective");
			await completeSecondDeclaration(page, { hasGap: true });
			await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });
		});

		await test.step("re-transmission depuis Mon espace", async () => {
			const panel = await openPanneauDemarche(page);
			await expect(panel.getByText("Démarche close")).toHaveCount(0);
			await transmittedRow(page, SECOND_DECLARATION_ROW)
				.getByRole("link", { name: "Modifier", exact: true })
				.click();
			await completeSecondDeclaration(page, { hasGap: true });
			// A gap that persists sends the company back to the revision choice: no
			// new initial declaration is asked for.
			await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });
			await expect(
				page.getByText(/ont de nouveau été constatés/),
			).toBeVisible();
		});

		await test.step("clôture sur « justifier » — seul le choix reste modifiable", async () => {
			await selectCompliancePath(page, "path-justify");
			await page.waitForURL(urlGlob(COMPLIANCE_CONFIRMATION), {
				timeout: 15_000,
			});
			await expectClosedDemarche(
				page,
				"Cette démarche est terminée. Votre choix de parcours reste modifiable.",
			);
			await expectRowModifiable(page, PATH_CHOICE_ROW, { modifiable: true });
			// The second declaration is no longer the last transmission, so the
			// single-step rule locks it again.
			await expectRowModifiable(page, SECOND_DECLARATION_ROW, {
				modifiable: false,
			});
		});
	});

	test("S3 — le choix de parcours terminal reste re-choisissable et l'historique est conservé", async ({
		page,
	}) => {
		test.setTimeout(300_000);
		await setCompanyHasCse(false);

		await test.step("démarche close sur « justifier »", async () => {
			await completeDeclaration(page, { hasGap: true });
			await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });
			await selectCompliancePath(page, "path-justify");
			await page.waitForURL(urlGlob(COMPLIANCE_CONFIRMATION), {
				timeout: 15_000,
			});
		});

		await expectClosedDemarche(
			page,
			"Cette démarche est terminée. Votre choix de parcours reste modifiable.",
		);
		await expectRowModifiable(page, PATH_CHOICE_ROW, { modifiable: true });

		await test.step("bascule vers l'évaluation conjointe", async () => {
			await transmittedRow(page, PATH_CHOICE_ROW)
				.getByRole("link", { name: "Modifier", exact: true })
				.click();
			await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });
			await expect(page.getByText(/ne peut plus être modifié/)).toHaveCount(0);
			await selectCompliancePath(page, "path-joint");
			await page.waitForURL(urlGlob(COMPLIANCE_JOINT_EVALUATION), {
				timeout: 15_000,
			});
		});

		await test.step("le choix précédent reste dans l'historique", async () => {
			expect(await countPathChoiceEventsRound1()).toBe(2);
			expect(await lastPathChoiceValueRound1()).toBe("joint_evaluation");
		});
	});

	test("S4 — avec CSE, seul l'avis reste modifiable et le rapport est en lecture seule", async ({
		page,
	}) => {
		test.setTimeout(300_000);
		await setCompanyHasCse(true);

		await test.step("rapport d'évaluation conjointe puis avis du CSE", async () => {
			await completeDeclaration(page, { hasGap: true });
			await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });
			await selectCompliancePath(page, "path-joint");
			await uploadJointEvalPdf(page);
			// The CSE funnel compiles on first use; a cold Turbopack build easily
			// outruns the default budget.
			await page.waitForURL(urlGlob(cseOpinionStepHref(1)), {
				timeout: 60_000,
			});
			await fillCseStep1(page, { firstDeclJustification: true });
			await submitCseStep2(page, {
				columns: [
					{ declarationNumber: 1, type: "accuracy" },
					{ declarationNumber: 1, type: "gap" },
				],
			});
		});

		await expectClosedDemarche(page, CSE_CLOSED_MESSAGE);
		await expectRowModifiable(page, CSE_OPINION_ROW, {
			modifiable: true,
			closedMention: false,
		});
		await expectRowModifiable(page, JOINT_REPORT_ROW, { modifiable: false });

		await test.step("le rapport reste consultable mais non modifiable", async () => {
			const row = transmittedRow(page, JOINT_REPORT_ROW);
			await expect(
				row.getByRole("link", {
					name: "Voir le rapport de l'évaluation conjointe",
				}),
			).toBeVisible();

			await page.goto(COMPLIANCE_JOINT_EVALUATION);
			await expect(
				page.locator("#joint-evaluation-file-upload"),
			).toBeDisabled();
			await expect(
				page.getByRole("button", { name: /transmettre/i }),
			).toBeDisabled();
		});
	});

	test("S5 — échéances dépassées: la seconde déclaration d'une démarche close reste modifiable", async ({
		page,
	}) => {
		test.setTimeout(300_000);
		await setCompanyHasCse(false);
		await setCampaignDeadlines(testDeclarationYear, PAST_DEADLINES);

		await test.step("démarche close sur la seconde déclaration, écart résolu", async () => {
			await completeDeclaration(page, { hasGap: true });
			await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });
			await selectCompliancePath(page, "path-corrective");
			await completeSecondDeclaration(page, { hasGap: false });
			await page.waitForURL(urlGlob(COMPLIANCE_CONFIRMATION), {
				timeout: 15_000,
			});
		});

		await expectClosedDemarche(
			page,
			"Cette démarche est terminée. Votre seconde déclaration reste modifiable.",
		);
		await expectRowModifiable(page, SECOND_DECLARATION_ROW, {
			modifiable: true,
		});

		await test.step("re-transmission malgré les échéances passées", async () => {
			await transmittedRow(page, SECOND_DECLARATION_ROW)
				.getByRole("link", { name: "Modifier", exact: true })
				.click();
			await page.waitForURL(urlGlob(complianceStepHref(1)), {
				timeout: 15_000,
			});
			await completeSecondDeclaration(page, { hasGap: false });
			await page.waitForURL(urlGlob(COMPLIANCE_CONFIRMATION), {
				timeout: 15_000,
			});
		});
	});
});

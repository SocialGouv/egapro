import { expect, type Page, test } from "@playwright/test";
import { urlGlob } from "~/e2e/helpers/routes";
import { getCurrentYear } from "~/modules/domain";
import {
	ADMIN_SETTINGS,
	COMPLIANCE_JOINT_EVALUATION,
	COMPLIANCE_PATH,
	CSE_OPINION,
	complianceStepHref,
	cseOpinionStepHref,
	remunerationStepHref,
} from "~/modules/routes";
import { TEST_USER_PHONE } from "./constants";
import { withCampaignYear } from "./helpers/campaign-year";
import {
	completeSecondDeclaration,
	fillCseStep1,
	selectCompliancePath,
	submitCseStep2,
	uploadJointEvalPdf,
} from "./helpers/compliance-flows";
import {
	deleteJointEvaluationFiles,
	pushCampaignDeadlinesFarFuture,
	resetDeclarationToDraft,
	resetGipWorkforce,
	setCompanyHasCse,
	setCompanyWorkforce,
	setUserPhone,
} from "./helpers/db";
import { setCampaignDeadlines } from "./helpers/db-campaign";
import {
	categoryPayInput,
	completeDeclaration,
} from "./helpers/declaration-flows";
import { openPanneauDemarche, transmittedRow } from "./helpers/process-panel";

// Match the year that api.declaration.getOrCreate() uses on first login.
const testDeclarationYear = getCurrentYear();

const FAR_FUTURE_DEADLINES = {
	decl1ModificationDeadline: "2099-06-01",
	decl1JustificationDeadline: "2099-06-01",
	decl1JointEvaluationDeadline: "2099-08-01",
	decl2ModificationDeadline: "2099-12-01",
	decl2JustificationDeadline: "2099-12-01",
	decl2JointEvaluationDeadline: "2100-01-01",
	decl2CseOpinionDeadline: "2100-02-01",
} as const;

const PAST_DEADLINES = {
	decl1ModificationDeadline: "2020-06-01",
	decl1JustificationDeadline: "2020-06-01",
	decl1JointEvaluationDeadline: "2020-08-01",
	decl2ModificationDeadline: "2020-12-01",
	decl2JustificationDeadline: "2020-12-01",
	decl2JointEvaluationDeadline: "2021-01-01",
	decl2CseOpinionDeadline: "2021-02-01",
} as const;

const FIRST_DECLARATION_ROW = "Votre déclaration a été transmise";
const SECOND_DECLARATION_ROW = "Votre seconde déclaration a été transmise";
const CSE_OPINION_ROW = "Vos avis du CSE ont été transmis";
const SUPERSEDED_BANNER =
	/Votre déclaration n'est plus modifiable : une étape suivante de votre démarche a déjà été transmise/;
const STEP2_EDITED_CELL = "Annuelle brute moyenne — Hommes";

async function expectModifiable(
	page: Page,
	label: string,
	options: { modifiable: boolean; mention?: string },
) {
	await openPanneauDemarche(page);
	const row = transmittedRow(page, label);
	await expect(row).toBeVisible();
	const modify = row.getByRole("link", { name: "Modifier", exact: true });
	if (options.modifiable) {
		await expect(modify).toBeVisible();
	} else {
		await expect(modify).toHaveCount(0);
	}
	if (options.mention) {
		await expect(row.getByText(options.mention, { exact: true })).toBeVisible();
	}
}

async function expectFirstDeclarationReadOnly(page: Page) {
	await page.goto(remunerationStepHref(2));
	await page.waitForURL(urlGlob(remunerationStepHref(2)));
	await expect(page.getByText(SUPERSEDED_BANNER)).toBeVisible();
	await expect(page.getByText(/modification close depuis le/i)).toHaveCount(0);
	await expect(
		page.getByRole("textbox", { name: STEP2_EDITED_CELL }),
	).not.toBeEditable();
	await page.getByRole("link", { name: "Suivant" }).click();
	await page.waitForURL(urlGlob(remunerationStepHref(3)));
}

async function saveDeadlinesThroughAdmin(
	page: Page,
	dates: typeof PAST_DEADLINES,
) {
	await test.step("admin — échéances de la démarche Rémunération", async () => {
		await page.goto(ADMIN_SETTINGS);
		const section = page
			.getByRole("region", { name: "Démarche Rémunération" })
			.getByRole("region", { name: /^Échéances de la campagne/ });
		const declaration = section.getByRole("group", {
			name: "Déclaration des indicateurs",
		});
		const firstRound = section.getByRole("group", {
			name: "Parcours de mise en conformité — 1er tour",
		});
		const secondRound = section.getByRole("group", {
			name: "Parcours de mise en conformité — 2nd tour",
		});
		const save = section.getByRole("button", { name: "Enregistrer" });
		const decl1Modification = declaration.getByLabel(
			"Échéance de déclaration",
			{ exact: true },
		);
		const decl2Modification = firstRound.getByLabel(
			"Échéance de la seconde déclaration (actions correctives)",
			{ exact: true },
		);
		// A pick made before hydration is reverted, so retry until the form reflects the campaign year.
		await expect(async () => {
			await page
				.locator("#campaign-year-selector")
				.selectOption(String(testDeclarationYear));
			await expect(
				section.getByRole("heading", {
					name: `Échéances de la campagne ${testDeclarationYear}`,
				}),
			).toBeVisible({ timeout: 1_000 });
		}).toPass({ timeout: 30_000 });
		// The form resets itself once the year's row loads; filling before that would be overwritten.
		await expect(decl1Modification).toHaveValue(/\d{4}-\d{2}-\d{2}/);
		await page.waitForLoadState("networkidle");

		await decl1Modification.fill(dates.decl2ModificationDeadline);
		await decl2Modification.fill(dates.decl1ModificationDeadline);
		await save.click();
		await expect(
			page.getByText(
				"L'échéance de la seconde déclaration (actions correctives) doit être postérieure à l'échéance de déclaration.",
			),
		).toBeVisible();

		await decl1Modification.fill(dates.decl1ModificationDeadline);
		await firstRound
			.getByLabel("Échéance de justification des écarts", { exact: true })
			.fill(dates.decl1JustificationDeadline);
		await firstRound
			.getByLabel("Échéance de dépôt du rapport d'évaluation conjointe", {
				exact: true,
			})
			.fill(dates.decl1JointEvaluationDeadline);
		await decl2Modification.fill(dates.decl2ModificationDeadline);
		await secondRound
			.getByLabel("Échéance de justification des écarts", { exact: true })
			.fill(dates.decl2JustificationDeadline);
		await secondRound
			.getByLabel("Échéance de dépôt du rapport d'évaluation conjointe", {
				exact: true,
			})
			.fill(dates.decl2JointEvaluationDeadline);
		await section
			.getByRole("group", { name: "Avis du CSE" })
			.getByLabel(/^Échéance de dépôt de l'avis du CSE/)
			.fill(dates.decl2CseOpinionDeadline);
		await save.click();
		await expect(
			page.getByText(`Échéances enregistrées pour ${testDeclarationYear}.`),
		).toBeVisible();
	});
}

test.describe("Campaign deadlines are informational; only the last submission is modifiable", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeEach(async () => {
		await resetDeclarationToDraft();
		await deleteJointEvaluationFiles();
		await resetGipWorkforce();
		await setCompanyHasCse(true);
		await setUserPhone(TEST_USER_PHONE);
	});

	test.afterAll(async () => {
		await pushCampaignDeadlinesFarFuture(testDeclarationYear);
		await resetDeclarationToDraft();
		await deleteJointEvaluationFiles();
		await setCompanyHasCse(true);
	});

	test("past deadlines block nothing, and the second declaration supersedes the first", async ({
		page,
	}) => {
		test.setTimeout(420_000);
		await saveDeadlinesThroughAdmin(page, PAST_DEADLINES);

		await test.step("S1 — la 1ʳᵉ déclaration se transmet, échéances passées", async () => {
			await completeDeclaration(page, { hasGap: true });
			await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });
			await expect(
				page.getByText(
					"Vous pouvez modifier votre déclaration jusqu'à ce que vous transmettiez une seconde déclaration, un rapport d'évaluation conjointe ou un avis du CSE.",
				),
			).toBeVisible();
			await expect(page.getByText(SUPERSEDED_BANNER)).toHaveCount(0);
		});

		await test.step("S2 — la 1ʳᵉ déclaration reste modifiable", async () => {
			await expectModifiable(page, FIRST_DECLARATION_ROW, {
				modifiable: true,
				mention: "Modifiable jusqu'à votre prochaine transmission",
			});
			await transmittedRow(page, FIRST_DECLARATION_ROW)
				.getByRole("link", { name: "Modifier", exact: true })
				.click();
			await page.waitForURL(urlGlob(remunerationStepHref(1)));
			await page.goto(remunerationStepHref(2));
			const cell = page.getByRole("textbox", { name: STEP2_EDITED_CELL });
			await expect(cell).toBeEditable();
			await cell.fill("1200");
			await page.getByRole("button", { name: "Suivant" }).click();
			await page.waitForURL(urlGlob(remunerationStepHref(3)));

			await selectCompliancePath(page, "path-corrective");
			await page.waitForURL(urlGlob(complianceStepHref(1)), {
				timeout: 15_000,
			});
			await expectModifiable(page, FIRST_DECLARATION_ROW, {
				modifiable: true,
			});
		});

		await test.step("S3 — la seconde déclaration se transmet et se re-transmet", async () => {
			await page.goto(complianceStepHref(1));
			await completeSecondDeclaration(page, { hasGap: true });
			await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });
			await expect(
				page.getByText(
					"Vous pouvez modifier votre seconde déclaration jusqu'au choix de votre nouveau parcours de mise en conformité.",
				),
			).toBeVisible();

			await expectModifiable(page, SECOND_DECLARATION_ROW, {
				modifiable: true,
				mention: "Modifiable jusqu'au choix de votre nouveau parcours",
			});
			await transmittedRow(page, SECOND_DECLARATION_ROW)
				.getByRole("link", { name: "Modifier", exact: true })
				.click();
			await completeSecondDeclaration(page, { hasGap: true });
			await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });
		});

		await test.step("S5 — la seconde déclaration verrouille la 1ʳᵉ, échéances lointaines", async () => {
			await setCampaignDeadlines(testDeclarationYear, FAR_FUTURE_DEADLINES);
			await page.goto(complianceStepHref(2));
			const secondDeclarationCell = categoryPayInput(page, {
				measure: "Salaire de base annuel",
				sex: "hommes",
			});
			await expect(secondDeclarationCell).not.toHaveValue("");
			const secondDeclarationValue = await secondDeclarationCell.inputValue();

			await expectModifiable(page, FIRST_DECLARATION_ROW, {
				modifiable: false,
			});
			await expect(
				transmittedRow(page, FIRST_DECLARATION_ROW).getByRole("link", {
					name: "Voir le récapitulatif de la déclaration",
				}),
			).toBeVisible();
			await expect(
				transmittedRow(page, SECOND_DECLARATION_ROW).getByRole("link", {
					name: "Modifier",
					exact: true,
				}),
			).toBeVisible();

			await expectFirstDeclarationReadOnly(page);

			await page.goto(complianceStepHref(2));
			await expect(secondDeclarationCell).toHaveValue(secondDeclarationValue);
		});

		await test.step("S4 — l'avis du CSE se transmet et reste modifiable, échéances passées", async () => {
			await setCampaignDeadlines(testDeclarationYear, PAST_DEADLINES);
			await selectCompliancePath(page, "path-justify");
			await page.waitForURL(urlGlob(cseOpinionStepHref(1)), {
				timeout: 15_000,
			});
			await fillCseStep1(page, {
				hasSecondDeclaration: true,
				secondDeclGapConsultationImplicit: true,
			});
			await submitCseStep2(page, {
				hasSecondDeclaration: true,
				columns: [
					{ declarationNumber: 1, type: "accuracy" },
					{ declarationNumber: 2, type: "accuracy" },
					{ declarationNumber: 2, type: "gap" },
				],
			});

			const panel = await openPanneauDemarche(page);
			await expect(panel.getByText("Démarche close")).toBeVisible();
			await expect(
				panel.getByText(
					"Cette démarche est terminée. Vos avis du CSE restent modifiables.",
				),
			).toBeVisible();
			await expect(
				transmittedRow(page, CSE_OPINION_ROW).getByRole("link", {
					name: "Modifier",
					exact: true,
				}),
			).toBeVisible();
			for (const label of [FIRST_DECLARATION_ROW, SECOND_DECLARATION_ROW]) {
				const row = transmittedRow(page, label);
				await expect(row).toBeVisible();
				await expect(
					row.getByRole("link", { name: "Modifier", exact: true }),
				).toHaveCount(0);
			}
		});
	});

	test.describe("far-future deadlines — the rule locks, not the date", () => {
		test.beforeAll(async () => {
			await setCampaignDeadlines(testDeclarationYear, FAR_FUTURE_DEADLINES);
		});

		test("S6 — the joint evaluation report supersedes the first declaration", async ({
			page,
		}) => {
			test.setTimeout(240_000);
			await completeDeclaration(page, { hasGap: true });
			await selectCompliancePath(page, "path-joint");
			await page.waitForURL(urlGlob(COMPLIANCE_JOINT_EVALUATION), {
				timeout: 60_000,
			});
			await expectModifiable(page, FIRST_DECLARATION_ROW, {
				modifiable: true,
			});

			await page.goto(COMPLIANCE_JOINT_EVALUATION);
			await uploadJointEvalPdf(page);
			await page.waitForURL(urlGlob(`${CSE_OPINION}/**`), { timeout: 15_000 });
			await expect(
				page.getByText(
					"Votre rapport de l'évaluation conjointe a été transmis",
				),
			).toBeVisible();
			await expect(
				page.getByText(/Échéance pour transmettre l'avis ou les avis du CSE/),
			).toBeVisible();

			await expectModifiable(page, FIRST_DECLARATION_ROW, {
				modifiable: false,
			});
			await expectFirstDeclarationReadOnly(page);
		});

		test("S7 — without a gap, the CSE opinion supersedes the first declaration", async ({
			page,
		}) => {
			test.setTimeout(240_000);
			await completeDeclaration(page, { hasGap: false });
			await page.waitForURL(urlGlob(`${CSE_OPINION}/**`), { timeout: 15_000 });
			await expectModifiable(page, FIRST_DECLARATION_ROW, {
				modifiable: true,
				mention: "Modifiable jusqu'à votre prochaine transmission",
			});

			await page.goto(cseOpinionStepHref(1));
			await fillCseStep1(page, { firstDeclGapCardHidden: true });
			await submitCseStep2(page);

			await expectModifiable(page, FIRST_DECLARATION_ROW, {
				modifiable: false,
			});
			await expect(
				transmittedRow(page, CSE_OPINION_ROW).getByRole("link", {
					name: "Modifier",
					exact: true,
				}),
			).toBeVisible();
		});
	});
});

// The path-choice deadline is the one campaign date that gates nothing (#4282).
// It is derived from the campaign year rather than read from app_campaign_deadline,
// so the only way to observe a stale one is to pin a past year: 2025 puts the
// round-2 milestone (1 January N+1) and the round-1 one (1 July N) both behind us.
const STALE_PATH_CHOICE_YEAR = 2025;
const STALE_ROUND1_DEADLINE = "1ᵉʳ juillet 2025";
const READ_ONLY_TAIL = /le choix du parcours ne peut plus être modifié/i;

test.describe("Path-choice deadline is informational, never a gate", () => {
	test.describe.configure({ mode: "serial" });

	test("a campaign year whose path-choice deadline has passed still lets the user choose and submit a path", async ({
		page,
	}) => {
		test.slow();
		await withCampaignYear(
			{ page, year: STALE_PATH_CHOICE_YEAR, workforce: 250 },
			async () => {
				await setCompanyWorkforce(200);
				await completeDeclaration(page, { hasGap: true });
				await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 15_000 });

				await expect(page.getByText(READ_ONLY_TAIL)).toHaveCount(0);
				await expect(page.locator("#path-corrective")).toBeEnabled();
				await expect(page.locator("#path-justify")).toBeEnabled();
				await expect(page.locator("#path-joint")).toBeEnabled();

				// The milestone outlives the gate it used to drive: still rendered, still
				// the round the company is in, now purely to nudge.
				await expect(
					page.getByText(
						"Échéance pour choisir un parcours de mise en conformité",
					),
				).toBeVisible();
				await expect(page.getByText(STALE_ROUND1_DEADLINE)).toBeVisible();

				await selectCompliancePath(page, "path-corrective");
				await page.waitForURL(urlGlob(complianceStepHref(1)), {
					timeout: 15_000,
				});
			},
		);
	});
});

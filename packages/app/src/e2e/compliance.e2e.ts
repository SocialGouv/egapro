import { expect, test } from "@playwright/test";
import {
	COMPLIANCE_PATH,
	completeSecondDeclaration,
	fillCseStep1,
	selectCompliancePath,
	submitCseStep2,
	uploadJointEvalPdf,
} from "./helpers/compliance-flows";
import {
	resetDeclarationToDraft,
	resetGipWorkforce,
	setCompanyHasCse,
	setCompanyWorkforce,
	setGipWorkforce,
} from "./helpers/db";
import {
	completeDeclaration,
	reachRecapWithoutGap,
	reachStep6ComplianceRecap,
	reachStep6Recap,
	submitFromStep6Recap,
} from "./helpers/declaration-flows";
import {
	indicatorGRequiredForGip,
	recapStepperLabel,
} from "./helpers/indicator-g";

test.describe.configure({ mode: "serial" });

const CONFIRMATION_PATH = `${COMPLIANCE_PATH}/confirmation`;
// Same literal as the unit tests of CompliancePathOptions: an `exact: true`
// assertion breaks silently on a wording change, and the negative assertion
// below would then pass for the wrong reason (text absent because renamed).
const CORRECTIVE_ACTION_TITLE =
	"Effectuer des actions correctives et une seconde déclaration";

// === GROUP A: No gap — auto-redirects ===

test.describe("[CAS-02] Path 1: no gap + hasCse → /avis-cse → full CSE flow", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("complete declaration without gap, then CSE opinion flow", async ({
		page,
	}) => {
		test.slow(); // Full declaration (6 steps) + CSE step 1 + CSE step 2
		await completeDeclaration(page, { hasGap: false });

		// No gap + hasCse → auto-redirect to /avis-cse
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
		await fillCseStep1(page);
		await submitCseStep2(page);
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

test.describe("[CAS-01] Path 2: no gap + no hasCse → /confirmation", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
		await setCompanyWorkforce(200);
	});

	test("complete declaration without gap, redirects to confirmation", async ({
		page,
	}) => {
		await completeDeclaration(page, { hasGap: false });

		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});

	test("reaching /avis-cse directly redirects away when there is no CSE", async ({
		page,
	}) => {
		// Every field of that funnel is required, so a company without a CSE
		// cannot fill it in — the screen must stay out of reach even by URL.
		await page.goto("/avis-cse/etape/1");

		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
	});
});

// === GROUP B: Gap — compliance choice form ===

test.describe("[CAS-04] Path 3: gap + hasCse → compliance choice → justify", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("complete declaration with gap, shows 3 compliance options", async ({
		page,
	}) => {
		await completeDeclaration(page, { hasGap: true });

		// Gap + hasCse → compliance choice page
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
		await expect(
			page.getByText(CORRECTIVE_ACTION_TITLE, {
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page.getByText(
				"Mettre en place une évaluation conjointe des rémunérations",
				{
					exact: true,
				},
			),
		).toBeVisible();
		await expect(
			page.getByText("Justifier les écarts de rémunération ≥ 5 %", {
				exact: true,
			}),
		).toBeVisible();
	});

	test("justify → CSE opinion with accuracy + gap justification columns", async ({
		page,
	}) => {
		test.slow(); // CSE step 1 (gap consulted) + step 2 matrix with 2 columns
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL("**/avis-cse/etape/1", { timeout: 10_000 });

		// CSE consulted on gap justification → step 2 requires the
		// "Justification" column on top of "Exactitude" (Excel: cas 4).
		await fillCseStep1(page, { firstDeclGapConsulted: true });
		await submitCseStep2(page, {
			columns: [
				{ declarationNumber: 1, type: "accuracy" },
				{ declarationNumber: 1, type: "gap" },
			],
		});
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

test.describe("[CAS-06] Path 4: gap + hasCse → joint evaluation → /avis-cse", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("complete declaration with gap, joint evaluation → CSE opinion deposited", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance choice + joint eval upload + CSE flow
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });

		// Complete the CSE opinion after the joint evaluation (Excel: cas 6 —
		// accuracy opinion, gap justification opinion being optional here).
		await fillCseStep1(page);
		await submitCseStep2(page);
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

test.describe("[CAS-05] Path 5: gap + no hasCse → joint evaluation → /confirmation", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
		await setCompanyWorkforce(200);
	});

	test("shows all 3 options including justify (hasCse=false)", async ({
		page,
	}) => {
		await completeDeclaration(page, { hasGap: true });
		await expect(
			page.getByText("Justifier les écarts de rémunération ≥ 5 %", {
				exact: true,
			}),
		).toBeVisible();
	});

	test("joint evaluation → upload PDF → /confirmation", async ({ page }) => {
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
	});
});

test.describe("[CAS-03] Path 5.b: gap + no hasCse → justify → /confirmation", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
		await setCompanyWorkforce(200);
	});

	test("justify without CSE completes the démarche directly", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance choice
		await completeDeclaration(page, { hasGap: true });

		// No CSE → the justify path has no opinion to deposit: the FSM goes
		// straight to demarche_completed (Excel: cas 3).
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

// === GROUP C: Corrective action — second declaration (no remaining gap) ===

test.describe("[CAS-08] Path 6: gap + corrective action (no gap after) + hasCse → /avis-cse", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("declaration → corrective action → correct without gap → CSE opinion on both declarations", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance + second declaration + CSE flow
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: false });
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });

		// Two declarations submitted → the CSE step asks for both opinions and
		// the step 2 matrix carries one "Exactitude" column per declaration
		// (Excel: cas 8).
		await fillCseStep1(page, { hasSecondDeclaration: true });
		await submitCseStep2(page, {
			hasSecondDeclaration: true,
			columns: [
				{ declarationNumber: 1, type: "accuracy" },
				{ declarationNumber: 2, type: "accuracy" },
			],
		});
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

test.describe("[CAS-07] Path 7: gap + corrective action (no gap after) + no hasCse → /confirmation", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
		await setCompanyWorkforce(200);
	});

	test("declaration → corrective action → correct without gap → /confirmation", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance + second declaration
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: false });
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
	});
});

// === GROUP D: Corrective action with remaining gap → second round ===

test.describe("[CAS-10] Path 8: gap + corrective action (gap persists) → second round choices", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("declaration → corrective action → correct WITH gap → back to compliance choice", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance + second declaration
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		// Gap still exists → redirect back to compliance choice
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
	});

	test("second round shows only justify and joint evaluation (no corrective action)", async ({
		page,
	}) => {
		await page.goto(COMPLIANCE_PATH);
		await expect(
			page.getByText("Justifier les écarts de rémunération ≥ 5 %", {
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page.getByText(
				"Mettre en place une évaluation conjointe des rémunérations",
				{
					exact: true,
				},
			),
		).toBeVisible();
		await expect(
			page.getByText(CORRECTIVE_ACTION_TITLE, {
				exact: true,
			}),
		).not.toBeVisible();
	});

	test("second round: justify → CSE opinion on both declarations with gap justification", async ({
		page,
	}) => {
		test.slow(); // CSE step 1 (2 declarations) + step 2 matrix with 3 columns
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL("**/avis-cse/etape/1", { timeout: 10_000 });

		// Both declarations keep a gap ≥ 5%; the CSE was consulted on justifying
		// the second one → step 2 requires accuracy ×2 + the second declaration's
		// "Justification" column (Excel: cas 10).
		await fillCseStep1(page, {
			hasSecondDeclaration: true,
			secondDeclGapConsulted: true,
		});
		await submitCseStep2(page, {
			hasSecondDeclaration: true,
			columns: [
				{ declarationNumber: 1, type: "accuracy" },
				{ declarationNumber: 2, type: "accuracy" },
				{ declarationNumber: 2, type: "gap" },
			],
		});
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

test.describe("[CAS-09] Path 9: second round + justify + no hasCse → /confirmation", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
		await setCompanyWorkforce(200);
	});

	test("full flow → second round → justify → /confirmation", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance + second decl + second round
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		// Gap persists → back to compliance choice for the second round
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });

		// No CSE → justify has no opinion to deposit: straight to completion
		// (Excel: cas 9).
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

test.describe("[CAS-12] Path 10: second round + joint evaluation + hasCse → /avis-cse", () => {
	test.beforeAll(async () => {
		// Fresh run: declaration → corrective action with gap → second round
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("full flow → second round → joint evaluation → CSE opinion on both declarations", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance + second decl + second round + CSE flow
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		// Now in second round
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });

		// Joint evaluation deposited → close the démarche with the CSE opinion
		// covering both declarations (Excel: cas 12).
		await fillCseStep1(page, { hasSecondDeclaration: true });
		await submitCseStep2(page, {
			hasSecondDeclaration: true,
			columns: [
				{ declarationNumber: 1, type: "accuracy" },
				{ declarationNumber: 2, type: "accuracy" },
			],
		});
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

test.describe("[CAS-11] Path 11: second round + joint evaluation + no hasCse → /confirmation", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
		await setCompanyWorkforce(200);
	});

	test("full flow → second round → joint evaluation → /confirmation", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance + second decl + second round
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
	});
});

// === GROUP F.0: /avis-cse Précédent button routes via rule-engine state ===

test.describe("[ANX-03] Path 13.a: no gap → /avis-cse Précédent → /etape/6 (recap)", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("after no-gap submission, Précédent on /avis-cse goes to step 6", async ({
		page,
	}) => {
		test.slow();
		await completeDeclaration(page, { hasGap: false });
		await page.waitForURL("**/avis-cse/etape/1", { timeout: 10_000 });
		await page.getByRole("link", { name: /Précédent/ }).click();
		await page.waitForURL("**/declaration-remuneration/etape/6", {
			timeout: 10_000,
		});
	});
});

test.describe("[ANX-03] Path 13.b: justify round 1 → /avis-cse Précédent → /parcours-conformite", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("after justify choice, Précédent on /avis-cse goes back to compliance choice", async ({
		page,
	}) => {
		test.slow();
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL("**/avis-cse/etape/1", { timeout: 10_000 });
		await page.getByRole("link", { name: /Précédent/ }).click();
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
	});
});

test.describe("[ANX-03] Path 13.c: corrective second decl resolved → /avis-cse Précédent → /etape/3", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("after second-decl resolved, Précédent on /avis-cse goes to second-decl recap", async ({
		page,
	}) => {
		test.slow();
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: false });
		await page.waitForURL("**/avis-cse/etape/1", { timeout: 10_000 });
		await page.getByRole("link", { name: /Précédent/ }).click();
		await page.waitForURL(`**${COMPLIANCE_PATH}/etape/3`, { timeout: 10_000 });
	});
});

// === GROUP F: Redirect guard (demarcheCompletedAt) ===

test.describe("[ANX-02] Path 12: compliance already completed → redirect", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("complete full flow, then verify compliance path redirects away", async ({
		page,
	}) => {
		test.slow(); // Full declaration + CSE step 1 + CSE step 2 + redirect check
		// Complete declaration without gap → auto-redirect to CSE → complete CSE
		await completeDeclaration(page, { hasGap: false });
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
		await fillCseStep1(page);
		await submitCseStep2(page);

		// demarcheCompletedAt is now set — navigating back should redirect
		await page.goto(COMPLIANCE_PATH);
		await page.waitForURL(
			(url) => !url.pathname.endsWith("/parcours-conformite"),
			{ timeout: 10_000 },
		);
		await expect(page).toHaveURL(/avis-cse/);
	});
});

// === GROUP G: "6 premiers indicateurs" variant — the 100-149 bracket ===
// GIP workforce 120 (bracket 100-149): the funnel drops the categories step and no
// compliance path can trigger (Excel: cas 1-2 of the "6 premiers indicateurs" columns).
// That bracket owes indicator G on the triennial years from 2030, so the funnel shape
// is read from the domain — the submission outcome under test is the same either way.
// resetGipWorkforce restores the suite baseline (>= 250) for any spec running after this one.
const GIP_120_INDICATOR_G = indicatorGRequiredForGip(120);

test.describe("[CAS-01-6IND] Path 14: GIP 120 (100-149) + no hasCse → direct completion", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setGipWorkforce(120);
		await setCompanyHasCse(false);
	});

	test.afterAll(async () => {
		await resetGipWorkforce();
	});

	test("submits the tier's funnel and completes the démarche directly", async ({
		page,
	}) => {
		test.slow(); // Full declaration + submission
		await reachRecapWithoutGap(page, {
			indicatorGRequired: GIP_120_INDICATOR_G,
		});
		await expect(
			page.getByText(recapStepperLabel(GIP_120_INDICATOR_G), { exact: true }),
		).toBeVisible();

		// Submit — no gap and no CSE → demarche completed directly
		await submitFromStep6Recap(page);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

test.describe("[CAS-02-6IND] Path 15: GIP 120 (100-149) + hasCse → /avis-cse", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setGipWorkforce(120);
		await setCompanyHasCse(true);
	});

	test.afterAll(async () => {
		await resetGipWorkforce();
	});

	test("submits the tier's funnel then deposits the CSE accuracy opinion", async ({
		page,
	}) => {
		test.slow(); // Full declaration + submission + CSE flow
		await reachRecapWithoutGap(page, {
			indicatorGRequired: GIP_120_INDICATOR_G,
		});

		// Submit — no gap but a CSE → straight to the CSE opinion
		await submitFromStep6Recap(page);
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });

		await fillCseStep1(page);
		await submitCseStep2(page);
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

// === GROUP H: [#3945] CSE opinion mentions gated by the declared CSE existence ===
// A company >= 100 that declared it has no CSE (hasCse false or null) must no
// longer be told to deposit a CSE opinion: the recap "Prochaines étapes" box and
// the compliance-choice options drop every CSE-opinion mention, while the gap
// actions and the "Mettre à jour l'existence d'un CSE" escape hatch stay.

const CSE_OPINION_RECAP_TEXT = /avis du CSE devront être transmis/;
const CSE_JUSTIFY_PARENTHESIS = /avis à transmettre sur le portail/;
const UPDATE_CSE_BUTTON = /Mettre à jour l.existence d.un CSE/;

test.describe("[#3945] gap + workforce >= 100 + hasCse=false → no CSE opinion mention", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
		await setCompanyWorkforce(200);
	});

	test("step 6 recap hides the CSE opinion but keeps the gap actions and the update-CSE button", async ({
		page,
	}) => {
		test.slow(); // Full 5-step declaration up to the recap
		await reachStep6ComplianceRecap(page);

		await expect(
			page.getByRole("heading", { name: "Prochaines étapes" }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Informer et consulter le CSE" }),
		).toHaveCount(0);
		await expect(page.getByText(CSE_OPINION_RECAP_TEXT)).toHaveCount(0);
		await expect(
			page.getByRole("link", { name: /Voir les modèles d.avis CSE/ }),
		).toHaveCount(0);
		await expect(page.getByText(CSE_JUSTIFY_PARENTHESIS)).toHaveCount(0);

		// Gap actions stay fully visible
		await expect(
			page.getByText("Écarts détectés", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Actions à engager" }),
		).toBeVisible();
		// Escape hatch for a mis-declared CSE flag stays available
		await expect(
			page.getByRole("button", { name: UPDATE_CSE_BUTTON }),
		).toBeVisible();
	});

	test("compliance choice page drops the CSE opinion bullets", async ({
		page,
	}) => {
		test.slow(); // Full declaration + submission
		await completeDeclaration(page, { hasGap: true });
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });

		await expect(
			page.getByText("Justifier les écarts de rémunération ≥ 5 %", {
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page.getByText("Transmettre l'avis du CSE", { exact: true }),
		).toHaveCount(0);
		await expect(
			page.getByText(/Transmettre l.avis ou les avis du CSE/),
		).toHaveCount(0);
	});
});

test.describe("[#3945] gap + workforce >= 100 + hasCse=null → no CSE opinion mention", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(null);
		await setCompanyWorkforce(200);
	});

	test("step 6 recap treats an unset CSE flag like an absent CSE", async ({
		page,
	}) => {
		test.slow(); // Full 5-step declaration up to the recap
		await reachStep6ComplianceRecap(page);

		await expect(
			page.getByRole("heading", { name: "Informer et consulter le CSE" }),
		).toHaveCount(0);
		await expect(page.getByText(CSE_OPINION_RECAP_TEXT)).toHaveCount(0);
		await expect(
			page.getByRole("button", { name: UPDATE_CSE_BUTTON }),
		).toBeVisible();
	});
});

test.describe("[#3945] gap + workforce >= 100 + hasCse=true → CSE opinion still shown", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("step 6 recap shows the CSE opinion mention", async ({ page }) => {
		test.slow(); // Full 5-step declaration up to the recap
		await reachStep6ComplianceRecap(page);

		await expect(
			page.getByRole("heading", { name: "Informer et consulter le CSE" }),
		).toBeVisible();
		await expect(page.getByText(CSE_OPINION_RECAP_TEXT)).toBeVisible();
		await expect(page.getByText(CSE_JUSTIFY_PARENTHESIS)).toBeVisible();
	});

	test("compliance choice page keeps the CSE opinion bullet", async ({
		page,
	}) => {
		test.slow(); // Full declaration + submission
		await completeDeclaration(page, { hasGap: true });
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });

		await expect(
			page.getByText("Transmettre l'avis du CSE", { exact: true }),
		).toBeVisible();
	});
});

// === GROUP I: tranches < 100 — the gap ≥ 5 % obligations stop at 100 salariés ===
// Arbitrage 2026-07 (#4043, cahier de tests §6): the voluntary tier (< 50) declares
// all 7 indicators every year, the 50-99 tier declares the 6 first ones outside its
// own indicator G years, and neither owes anything when a gap ≥ 5 % shows up — the
// compliance process, the second declaration, the joint evaluation and the CSE
// opinion all stay gated at 100 salariés (Excel sheet "<50 et 50-99").
// `hasCse` starts unset, as the question is never asked below 100 — but the CSE
// probe of [CAS-14] declares one on purpose: `isCseOpinionRequired` is an AND of
// the effectif and the CSE, so leaving `hasCse` unset would keep that probe green
// even with no threshold at all, and [CAS-01] already covers the absent CSE. Each
// describe restores the file's exit state (GIP >= 250 + hasCse true) after it.

test.describe("[CAS-13] 7 indicators + GIP 30 (< 50) + no gap → direct completion", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setGipWorkforce(30);
		await setCompanyHasCse(null);
	});

	test.afterAll(async () => {
		await resetGipWorkforce();
		await setCompanyHasCse(true);
	});

	test("declares the 7 indicators and completes the démarche directly", async ({
		page,
	}) => {
		test.slow(); // 6-step declaration + submission
		await reachStep6Recap(page, { hasGap: false });

		// Step 5 was presented: 6-step funnel + indicator G block on the recap.
		// `exact` scopes to the stepper — the Next.js route announcer repeats the
		// label followed by the step title.
		await expect(
			page.getByText("Étape 6 sur 6", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: "Indicateurs par catégorie de salariés",
			}),
		).toBeVisible();

		await submitFromStep6Recap(page);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

test.describe("[CAS-14] 7 indicators + GIP 30 (< 50) + gap ≥ 5 % → no obligation triggered", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setGipWorkforce(30);
		await setCompanyHasCse(null);
	});

	test.afterAll(async () => {
		await resetGipWorkforce();
		await setCompanyHasCse(true);
	});

	test("the recap proposes no compliance action despite the gap", async ({
		page,
	}) => {
		test.slow(); // 6-step declaration up to the recap
		await reachStep6ComplianceRecap(page);

		// Same gap inputs that render the "Prochaines étapes" box at 200 salariés
		// (GROUP H): below 100 nothing is due, so the box is absent altogether.
		await expect(
			page.getByRole("heading", { name: "Prochaines étapes" }),
		).toHaveCount(0);
		await expect(
			page.getByText("Écarts détectés", { exact: true }),
		).toHaveCount(0);
		await expect(
			page.getByRole("heading", { name: "Actions à engager" }),
		).toHaveCount(0);
	});

	test("submits into a direct completion, with every compliance surface out of reach", async ({
		page,
	}) => {
		await page.goto("/declaration-remuneration/etape/6");
		await submitFromStep6Recap(page);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();

		// The compliance path choice, which carries the second declaration and the
		// joint evaluation, is unreachable even by URL: below 100 salariés a gap
		// ≥ 5 % opens none of them.
		await page.goto(COMPLIANCE_PATH);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });

		// Declaring a CSE leaves the effectif as the only unmet term of
		// `isCseOpinionRequired`, so this probe fails if the 100-salarié gate goes
		// away — which an unset `hasCse` would have hidden.
		await setCompanyHasCse(true);
		const cseFunnelResponse = await page.goto("/avis-cse/etape/1");

		// Read off the settled navigation instead of polling for the URL: a gate
		// bouncing this company back into /avis-cse loops, and must surface as a
		// redirect error or as the funnel pathname, never as a silent timeout.
		expect(cseFunnelResponse?.ok()).toBe(true);
		expect(new URL(page.url()).pathname).toBe(CONFIRMATION_PATH);
		await expect(
			page.getByRole("heading", {
				name: "Transmettre l'avis ou les avis du CSE",
			}),
		).toHaveCount(0);
		await expect(page.locator("#first-decl-accuracy-favorable")).toHaveCount(0);
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

// The cahier describes this case on the 6-indicator variant, which is what the 50-99
// tier declares outside its own indicator G years. On those years (2030, 2033, …) the
// same company declares the 7 indicators instead, so the funnel shape is read from the
// domain — what is under test either way is the outcome: below 100 salariés a gap-free
// declaration completes the démarche directly, with no compliance obligation.
test.describe("[CAS-13-6IND] GIP 75 (50-99) → direct completion", () => {
	const indicatorGRequired = indicatorGRequiredForGip(75);

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setGipWorkforce(75);
		await setCompanyHasCse(null);
	});

	test.afterAll(async () => {
		await resetGipWorkforce();
		await setCompanyHasCse(true);
	});

	test("submits the tier's funnel and completes the démarche directly", async ({
		page,
	}) => {
		test.slow(); // Full declaration + submission
		await page.goto("/declaration-remuneration/etape/5");
		if (indicatorGRequired) {
			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/5$/);
			await expect(
				page.getByRole("heading", {
					name: /Écart de rémunération par catégories de salariés/,
				}),
			).toBeVisible();
		} else {
			// Off those years step 5 is out of reach even by URL — unlike the < 50
			// tier, which always carries it.
			await expect(page).toHaveURL(/\/declaration-remuneration\/etape\/6$/);
		}

		await reachRecapWithoutGap(page, { indicatorGRequired });
		await expect(
			page.getByText(recapStepperLabel(indicatorGRequired), { exact: true }),
		).toBeVisible();

		await submitFromStep6Recap(page);
		await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
		await expect(
			page.getByText(/Votre parcours .* est (désormais )?terminé/),
		).toBeVisible();
	});
});

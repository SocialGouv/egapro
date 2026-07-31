import { expect, test } from "@playwright/test";
import { withCampaignYear } from "./helpers/campaign-year";
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
	setCompanyHasCse,
	setCompanyWorkforce,
} from "./helpers/db";
import {
	completeDeclaration,
	reachStep6ComplianceRecap,
	submitStepsThroughQuartiles,
} from "./helpers/declaration-flows";

test.describe.configure({ mode: "serial" });

const CONFIRMATION_PATH = `${COMPLIANCE_PATH}/confirmation`;

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
			page.getByText("Actions correctives et seconde déclaration", {
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
			page.getByText("Actions correctives et seconde déclaration", {
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

// === GROUP G: indicator G gated by the campaign year (#4022 / #4067) ===
// Whether the funnel carries the categories step (step 5 / indicator G) is
// decided by isIndicatorGRequired(workforce, year): below 250 it only applies on
// the triennial cadence (base 2027), and — from 2030 — down to every mandatory
// 50+ company. Every spec here PINS its campaign year through withCampaignYear so
// both branches stay exercised instead of silently flipping when the calendar
// reaches 2030; the fixture also tears the coordinate down, leaving no residue.

// 2029: < 2030 and off the triennial cadence → indicator G not required for < 250.
const SIX_INDICATOR_YEAR = 2029;
// 2030: triennial ((2030-2027) % 3 === 0) and >= 2030 → indicator G required for 50+.
const SEVEN_INDICATOR_YEAR = 2030;

test.describe("[CAS-01-6IND] Path 14: 6 indicators (no G) + no hasCse → direct completion", () => {
	test("submits the 5-step funnel and completes the démarche directly", async ({
		page,
	}) => {
		test.slow(); // 5-step declaration + submission
		await withCampaignYear(
			{ page, year: SIX_INDICATOR_YEAR, workforce: 120 },
			async () => {
				await setCompanyHasCse(false);
				await submitStepsThroughQuartiles(page);
				await page.waitForURL("**/declaration-remuneration/etape/6");
				await expect(page.getByText("Étape 5 sur 5")).toBeVisible();

				await page.getByRole("button", { name: "Suivant" }).click();
				await page.getByText(/Je certifie/).click();
				await page.getByRole("button", { name: "Valider" }).click();
				await page.waitForURL(`**${CONFIRMATION_PATH}`, { timeout: 10_000 });
				await expect(
					page.getByText(/Votre parcours .* est (désormais )?terminé/),
				).toBeVisible();
			},
		);
	});
});

test.describe("[CAS-02-6IND] Path 15: 6 indicators (no G) + hasCse → /avis-cse", () => {
	test("submits the 5-step funnel then deposits the CSE accuracy opinion", async ({
		page,
	}) => {
		test.slow(); // 5-step declaration + submission + CSE flow
		await withCampaignYear(
			{ page, year: SIX_INDICATOR_YEAR, workforce: 120 },
			async () => {
				await setCompanyHasCse(true);
				await submitStepsThroughQuartiles(page);
				await page.waitForURL("**/declaration-remuneration/etape/6");

				await page.getByRole("button", { name: "Suivant" }).click();
				await page.getByText(/Je certifie/).click();
				await page.getByRole("button", { name: "Valider" }).click();
				await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });

				await fillCseStep1(page);
				await submitCseStep2(page);
				await expect(
					page.getByText(/Votre parcours .* est (désormais )?terminé/),
				).toBeVisible();
			},
		);
	});
});

// ANX-04 — the OTHER branch of CAS-01/02-6IND: the same 100-149 company gains step 5
// in a triennial year from 2030 — the assertion that would have silently broken
// without #4067. Kept lightweight (funnel shape only): the full compliance flows
// for a 7-indicator company are already covered by the >= 250 baseline cases.
test.describe("[ANX-04] Path 14bis: 100-149 company regains indicator G in a triennial year >= 2030", () => {
	test("the funnel carries the indicator-G step (6 steps)", async ({
		page,
	}) => {
		await withCampaignYear(
			{ page, year: SEVEN_INDICATOR_YEAR, workforce: 120 },
			async () => {
				await page.goto("/declaration-remuneration/etape/1");
				await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
				await page.goto("/declaration-remuneration/etape/5");
				await expect(page.getByText("Étape 5 sur 6")).toBeVisible();
			},
		);
	});
});

// ANX-05 — the 50-99 tranche (scenarios S1/S2 of #4067): indicator G is
// absent below 2030 and returns only in a triennial year from 2030.
test.describe("[ANX-05] Path 13: 50-99 tranche — indicator G gated by the pinned year", () => {
	test.describe.configure({ mode: "serial" });

	test("6-indicator year (2029): step 5 is absent and unreachable by direct URL", async ({
		page,
	}) => {
		await withCampaignYear(
			{ page, year: SIX_INDICATOR_YEAR, workforce: 75 },
			async () => {
				await page.goto("/declaration-remuneration/etape/1");
				await expect(page.getByText("Étape 1 sur 5")).toBeVisible();
				// The categories step is out of reach even by URL: it redirects to the recap.
				await page.goto("/declaration-remuneration/etape/5");
				await page.waitForURL("**/declaration-remuneration/etape/6");
				await expect(page.getByText("Étape 5 sur 5")).toBeVisible();
			},
		);
	});

	test("7-indicator year (2030): step 5 is present and the stepper counts 6", async ({
		page,
	}) => {
		await withCampaignYear(
			{ page, year: SEVEN_INDICATOR_YEAR, workforce: 75 },
			async () => {
				// Initialise the declaration first so the step 5 URL is reachable.
				await page.goto("/declaration-remuneration/etape/1");
				await expect(page.getByText("Étape 1 sur 6")).toBeVisible();
				await page.goto("/declaration-remuneration/etape/5");
				await expect(page.getByText("Étape 5 sur 6")).toBeVisible();
			},
		);
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

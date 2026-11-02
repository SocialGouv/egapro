import { test } from "@playwright/test";
import {
	getReferenceYearFor,
	REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
} from "~/modules/domain";
import {
	COMPLIANCE_CONFIRMATION,
	COMPLIANCE_JOINT_EVALUATION,
	COMPLIANCE_PATH,
	CSE_OPINION_CONFIRMATION,
	DECLARATION_REMUNERATION_RECAP,
	DECLARATION_REPRESENTATION,
	DECLARATION_REPRESENTATION_CONFIRMATION,
	FORMAL_NOTICE_JOINT_EVALUATION,
	MY_SPACE_CSE_OPINION_VIEW,
	MY_SPACE_JOINT_EVALUATION_VIEW,
	REPRESENTATION_STEP_NUMBERS,
	representationStepHref,
} from "~/modules/routes";
import {
	deleteCseOpinions,
	deleteFormalNoticeFiles,
	deleteJointEvaluationFiles,
	ensureCurrentYearDeclaration,
	getCurrentDbYear,
	insertCseOpinion,
	insertCseOpinionFile,
	insertJointEvaluationFile,
	resetDeclarationToDraft,
	resetGipWorkforce,
	resetRepresentationDeclaration,
	seedRepresentationDraft,
	seedSubmittedRepresentationDeclaration,
	setCompanyHasCse,
	setCompanyWorkforce,
	setDeclarationComplianceState,
	setGapCseOpinion,
	setGipWorkforce,
	setRepresentationWorkforceWindow,
} from "../helpers/db";
import { completeDeclaration } from "../helpers/declaration-flows";
import { insertJointEvaluationSubmission } from "../helpers/declaration-history";
import { urlGlob } from "../helpers/routes";
import { snapshotCurrentPage, snapshotRoute } from "./snapshot";

// The tunnel screens are gated by the démarche state machine, so they cannot simply be
// visited: each one is reachable only from a given declaration state. Rather than replay a
// full UI flow per screen (minutes per page, and a failure anywhere loses every later page),
// the declaration record is pinned directly to the state that opens the screen — the same
// seam `compliance.e2e.ts` and `my-space.e2e.ts` already use.
//
// Serial: every test mutates the one shared declaration (SIREN of the test company), so they
// must not interleave. The config already pins `workers: 1`; this makes the intent explicit
// and stops a later refactor from parallelising it by accident.
test.describe.configure({ mode: "serial" });

const DECLARATION_TOTAL_STEPS = 6;
const COMPLIANCE_TOTAL_STEPS = 3;
const CSE_TOTAL_STEPS = 2;

const DECLARATION_STEP_SOURCE =
	"src/app/declaration-remuneration/(with-banner)/etape/[step]/page.tsx";
const COMPLIANCE_STEP_SOURCE =
	"src/app/declaration-remuneration/(with-banner)/parcours-conformite/etape/[step]/page.tsx";
const CSE_STEP_SOURCE = "src/app/avis-cse/etape/[step]/page.tsx";
const REPRESENTATION_STEP_SOURCE =
	"src/app/declaration-representation/etape/[step]/page.tsx";

test.describe("RGAA — déclaration de représentation équilibrée", () => {
	let referenceYear: number;
	let seededYears: number[] = [];

	test.beforeAll(async () => {
		const campaignYear = await getCurrentDbYear();
		referenceYear = getReferenceYearFor(campaignYear);
		await resetRepresentationDeclaration();
		seededYears = await setRepresentationWorkforceWindow(
			campaignYear,
			REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
		);
	});

	test.afterAll(async () => {
		await resetRepresentationDeclaration();
		for (const year of seededYears) {
			await setGipWorkforce(null, year);
		}
		await resetGipWorkforce();
	});

	test("snapshot l'écran d'assujettissement", async ({ page }) => {
		await snapshotRoute(page, {
			path: DECLARATION_REPRESENTATION,
			id: "declaration-representation",
			name: "Représentation équilibrée — assujettissement",
			sources: [
				"src/app/declaration-representation/page.tsx",
				"src/modules/declaration-representation/SubjectionScreen.tsx",
			],
			auth: true,
			notes:
				"Aucune déclaration de représentation entamée : seul cet état ouvre l'écran, une déclaration commencée renvoie à son étape.",
		});
	});

	for (const step of REPRESENTATION_STEP_NUMBERS) {
		test(`snapshot l'étape ${step} de la représentation`, async ({ page }) => {
			// Re-seeded per step: the funnel autosaves, and a save on one step must not close the next.
			await seedRepresentationDraft(referenceYear);

			await snapshotRoute(page, {
				path: representationStepHref(step),
				id: `declaration-representation-etape-${step}`,
				name: `Représentation équilibrée — étape ${step} sur ${REPRESENTATION_STEP_NUMBERS.length}`,
				sources: [REPRESENTATION_STEP_SOURCE],
				auth: true,
				notes:
					"Brouillon rempli jusqu'au récapitulatif, campagne de représentation ouverte.",
			});
		});
	}

	test("snapshot la confirmation de la représentation", async ({ page }) => {
		await seedSubmittedRepresentationDeclaration(referenceYear);

		await snapshotRoute(page, {
			path: DECLARATION_REPRESENTATION_CONFIRMATION,
			id: "declaration-representation-confirmation",
			name: "Représentation équilibrée — confirmation",
			sources: ["src/app/declaration-representation/confirmation/page.tsx"],
			auth: true,
			notes:
				"Déclaration de représentation transmise — la confirmation renvoie à l'étape 5 sur une déclaration non transmise.",
		});
	});
});

test.describe("RGAA — mise en demeure", () => {
	test.beforeAll(async () => {
		const year = await getCurrentDbYear();
		await resetDeclarationToDraft();
		await ensureCurrentYearDeclaration(year);
		await setCompanyHasCse(true);
		await deleteCseOpinions();
		await deleteFormalNoticeFiles();
		await setDeclarationComplianceState({
			status: "demarche_completed",
			firstDeclarationPathChoice: "justify",
			cseRequired: true,
			demarcheCompletedAt: new Date(),
			cseOpinionCompletedAt: new Date(),
		});
		await setGapCseOpinion(year, "unfavorable");
	});

	test.afterAll(async () => {
		await deleteFormalNoticeFiles();
		await deleteCseOpinions();
		await resetDeclarationToDraft();
	});

	test("snapshot le dépôt du rapport après mise en demeure", async ({
		page,
	}) => {
		await snapshotRoute(page, {
			path: FORMAL_NOTICE_JOINT_EVALUATION,
			id: "mise-en-demeure",
			name: "Évaluation conjointe — mise en demeure",
			sources: ["src/app/declaration-remuneration/mise-en-demeure/page.tsx"],
			auth: true,
			notes:
				"Démarche close sur une justification que le CSE a jugée défavorablement, aucun rapport encore déposé.",
		});
	});
});

test.describe("RGAA — documents transmis (Mon espace)", () => {
	test.beforeAll(async () => {
		const year = await getCurrentDbYear();
		await ensureCurrentYearDeclaration(year);
		await resetDeclarationToDraft();
		await deleteJointEvaluationFiles();
		await deleteCseOpinions();
		await setCompanyHasCse(true);
		await setGipWorkforce(120);
		await setDeclarationComplianceState({
			status: "demarche_completed",
			firstDeclarationPathChoice: "joint_evaluation",
			cseRequired: true,
			cseOpinionCompletedAt: new Date(),
			demarcheCompletedAt: new Date(),
		});
		await insertCseOpinion(year);
		await insertCseOpinionFile(year);
		await insertJointEvaluationFile(year);
		await insertJointEvaluationSubmission(year);
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
		await deleteJointEvaluationFiles();
		await deleteCseOpinions();
		await resetGipWorkforce();
	});

	test("snapshot les avis du CSE transmis", async ({ page }) => {
		await snapshotRoute(page, {
			path: MY_SPACE_CSE_OPINION_VIEW,
			id: "mon-espace-avis-cse",
			name: "Mon espace — avis du CSE transmis",
			sources: [
				"src/app/mon-espace/avis-cse/page.tsx",
				"src/modules/cseOpinion/SubmittedOpinionsPage.tsx",
			],
			auth: true,
			notes:
				"Démarche close par une évaluation conjointe, avis du CSE et son fichier transmis.",
		});
	});

	test("snapshot le rapport de l'évaluation conjointe transmis", async ({
		page,
	}) => {
		await snapshotRoute(page, {
			path: MY_SPACE_JOINT_EVALUATION_VIEW,
			id: "mon-espace-evaluation-conjointe",
			name: "Mon espace — rapport de l'évaluation conjointe",
			sources: [
				"src/app/mon-espace/evaluation-conjointe/page.tsx",
				"src/modules/joint-evaluation-view/JointEvaluationView.tsx",
			],
			auth: true,
			notes:
				"Démarche close par une évaluation conjointe dont le rapport a été transmis.",
		});
	});
});

test.describe("RGAA — tunnel de déclaration (indicateurs A–F)", () => {
	test.beforeAll(async () => {
		// A submitted declaration closes the funnel; the sample needs it open.
		await resetDeclarationToDraft();
	});

	// `/declaration-remuneration` and `/avis-cse` are unconditional `redirect()` routes with
	// no content of their own — they are not pages in the RGAA sense and are deliberately not
	// sampled: recording them would duplicate step 1 under a second identity.

	for (let step = 1; step <= DECLARATION_TOTAL_STEPS; step++) {
		test(`snapshot l'étape ${step} du tunnel`, async ({ page }) => {
			await snapshotRoute(page, {
				path: `/declaration-remuneration/etape/${step}`,
				id: `declaration-etape-${step}`,
				name: `Déclaration — étape ${step} sur ${DECLARATION_TOTAL_STEPS}`,
				sources: [DECLARATION_STEP_SOURCE],
				auth: true,
				notes:
					"Déclaration en brouillon, entreprise assujettie à l'indicateur G (effectif ≥ 250).",
			});
		});
	}

	// The récapitulatif is deliberately NOT here. It is the one funnel page a draft does not
	// open: `recapitulatif/page.tsx` calls `notFound()` on a draft declaration, which renders
	// Next's 404 AT the requested URL — no redirect to notice. Snapshotted from this describe
	// it produced a page sheet titled « Déclaration — récapitulatif » describing the error
	// page. It now lives in the compliance describe below, after the real submission that
	// makes it reachable.
});

test.describe("RGAA — parcours de conformité", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	// The path-choice screen is the one screen a pinned DB state does NOT open: the state
	// machine routes on more than the stored status, and a direct visit lands on the CSE
	// step instead. So this one goes through the real submission, exactly as
	// the `[ANX-01]` describe of `compliance.e2e.ts` does — it is also what puts the declaration
	// into the state the rest of this describe pins from.
	test("snapshot le choix du parcours", async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 10_000 });

		await snapshotCurrentPage(page, {
			path: COMPLIANCE_PATH,
			id: "parcours-conformite",
			name: "Parcours de conformité — choix du parcours",
			sources: [
				"src/app/declaration-remuneration/(with-banner)/parcours-conformite/page.tsx",
			],
			auth: true,
			notes: "Déclaration transmise avec un écart ≥ 5 %.",
		});
	});

	// Reachable only now: the submission above is what takes the declaration out of draft, and
	// `recapitulatif/page.tsx` answers `notFound()` on a draft one. Ordering, not seeding, is
	// what opens it — the record has to have really been transmitted.
	test("snapshot le récapitulatif", async ({ page }) => {
		await snapshotRoute(page, {
			path: DECLARATION_REMUNERATION_RECAP,
			id: "declaration-recapitulatif",
			name: "Déclaration — récapitulatif",
			sources: ["src/app/declaration-remuneration/recapitulatif/page.tsx"],
			auth: true,
			notes:
				"Déclaration transmise — le récapitulatif est fermé sur un brouillon.",
		});
	});

	for (let step = 1; step <= COMPLIANCE_TOTAL_STEPS; step++) {
		test(`snapshot l'étape ${step} de la seconde déclaration`, async ({
			page,
		}) => {
			await setDeclarationComplianceState({
				status: "awaiting_compliance_path_choice",
				currentStep: 6,
				firstDeclarationPathChoice: "corrective_action",
				cseRequired: true,
			});

			await snapshotRoute(page, {
				path: `/declaration-remuneration/parcours-conformite/etape/${step}`,
				id: `parcours-conformite-etape-${step}`,
				name: `Seconde déclaration — étape ${step} sur ${COMPLIANCE_TOTAL_STEPS}`,
				sources: [COMPLIANCE_STEP_SOURCE],
				auth: true,
				notes: "Parcours « actions correctives » choisi.",
			});
		});
	}

	test("snapshot l'évaluation conjointe", async ({ page }) => {
		await setDeclarationComplianceState({
			status: "awaiting_compliance_path_choice",
			currentStep: 6,
			firstDeclarationPathChoice: "joint_evaluation",
			cseRequired: true,
		});

		await snapshotRoute(page, {
			path: COMPLIANCE_JOINT_EVALUATION,
			id: "evaluation-conjointe",
			name: "Parcours de conformité — évaluation conjointe",
			sources: [
				"src/app/declaration-remuneration/(with-banner)/parcours-conformite/evaluation-conjointe/page.tsx",
			],
			auth: true,
			notes: "Parcours « évaluation conjointe » choisi.",
		});
	});

	test("snapshot la confirmation du parcours", async ({ page }) => {
		await page.goto(COMPLIANCE_CONFIRMATION);
		await snapshotCurrentPage(page, {
			path: COMPLIANCE_CONFIRMATION,
			id: "parcours-conformite-confirmation",
			name: "Parcours de conformité — confirmation",
			sources: [
				"src/app/declaration-remuneration/(with-banner)/parcours-conformite/confirmation/page.tsx",
			],
			auth: true,
		});
	});
});

test.describe("RGAA — avis du CSE", () => {
	test.beforeAll(async () => {
		// The CSE screens are reserved to companies that declared a CSE.
		await setCompanyHasCse(true);
		await setDeclarationComplianceState({
			status: "awaiting_compliance_path_choice",
			currentStep: 6,
			firstDeclarationPathChoice: "corrective_action",
			cseRequired: true,
		});
	});

	for (let step = 1; step <= CSE_TOTAL_STEPS; step++) {
		test(`snapshot l'étape ${step} de l'avis du CSE`, async ({ page }) => {
			await snapshotRoute(page, {
				path: `/avis-cse/etape/${step}`,
				id: `avis-cse-etape-${step}`,
				name: `Avis du CSE — étape ${step} sur ${CSE_TOTAL_STEPS}`,
				sources: [CSE_STEP_SOURCE],
				auth: true,
				notes: "Entreprise ayant déclaré un CSE.",
			});
		});
	}

	test("snapshot la confirmation de l'avis du CSE", async ({ page }) => {
		await page.goto(CSE_OPINION_CONFIRMATION);
		await snapshotCurrentPage(page, {
			path: CSE_OPINION_CONFIRMATION,
			id: "avis-cse-confirmation",
			name: "Avis du CSE — confirmation",
			sources: ["src/app/avis-cse/confirmation/page.tsx"],
			auth: true,
		});
	});
});

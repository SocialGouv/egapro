import { test } from "@playwright/test";

import { COMPLIANCE_PATH } from "../helpers/compliance-flows";
import {
	resetDeclarationToDraft,
	setCompanyHasCse,
	setCompanyWorkforce,
	setDeclarationComplianceState,
} from "../helpers/db";
import { completeDeclaration } from "../helpers/declaration-flows";
import { snapshotCurrentPage, snapshotRoute } from "./snapshot";

// The tunnel screens are gated by the démarche state machine, so they cannot simply be
// visited: each one is reachable only from a given declaration state. Rather than replay a
// full UI flow per screen (minutes per page, and a failure anywhere loses every later page),
// the declaration record is pinned directly to the state that opens the screen — the same
// seam `compliance-path-change.e2e.ts` and `declaration-process-panel.e2e.ts` already use.
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
	// `compliance-path-change.e2e.ts` does — it is also what puts the declaration into the
	// state the rest of this describe pins from.
	test("snapshot le choix du parcours", async ({ page }) => {
		await completeDeclaration(page, { hasGap: true });
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });

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
			path: "/declaration-remuneration/recapitulatif",
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
			path: "/declaration-remuneration/parcours-conformite/evaluation-conjointe",
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
		await page.goto(
			"/declaration-remuneration/parcours-conformite/confirmation",
		);
		await snapshotCurrentPage(page, {
			path: "/declaration-remuneration/parcours-conformite/confirmation",
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
		await page.goto("/avis-cse/confirmation");
		await snapshotCurrentPage(page, {
			path: "/avis-cse/confirmation",
			id: "avis-cse-confirmation",
			name: "Avis du CSE — confirmation",
			sources: ["src/app/avis-cse/confirmation/page.tsx"],
			auth: true,
		});
	});
});

import type { ChildProcess } from "node:child_process";
import { expect, test } from "@playwright/test";
import { urlGlob } from "~/e2e/helpers/routes";
import {
	API_TRANSMITTED_PDF,
	COMPLIANCE_JOINT_EVALUATION,
	COMPLIANCE_PATH,
	CSE_OPINION,
	complianceStepHref,
	cseOpinionStepHref,
	remunerationStepHref,
} from "~/modules/routes";
import { buildGrid, pickCoordinate } from "./grille/coordinates";
import { FICHE_SCENARIOS } from "./grille/scenarios";
import {
	completeSecondDeclaration,
	fillCseStep1,
	selectCompliancePath,
	submitCseStep2,
} from "./helpers/compliance-flows";
import {
	countPathChoiceEventsRound1,
	lastPathChoiceValueRound1,
	resetDeclarationToDraft,
	resetGipWorkforce,
	setCompanyHasCse,
	setCompanyWorkforce,
	setGipWorkforce,
} from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";
import {
	killWorker,
	spawnNotificationsWorker,
	waitForWorkerReady,
} from "./helpers/notifications-worker";
import { mailChainAvailable } from "./helpers/receipts";

// CAS-03 and CAS-09 assert the acknowledgement that closes their démarche (#4293),
// and nothing drains pg-boss in this workflow: without a worker the receipt is
// enqueued and never sent, so the assertion would wait out its timeout on an
// environment gap rather than on the rule under test. Same spawn as
// `grille.grille.ts` and `notifications-email-flow.e2e.ts`; `workers: 1` keeps
// these three from ever holding a worker at the same time.
let notificationsWorker: ChildProcess | null = null;

test.beforeAll(async () => {
	if (!(await mailChainAvailable())) return;
	notificationsWorker = spawnNotificationsWorker();
	await waitForWorkerReady(notificationsWorker);
});

test.afterAll(async () => {
	if (notificationsWorker) await killWorker(notificationsWorker);
});

// The 185 coordinates are derived from the domain (grille/coordinates.ts); every
// fiche's parcours-type lives in FICHE_SCENARIOS (grille/scenarios.ts). Each
// describe below keeps its literal [CAS-xx] tag (read by check-cahier), keeps its
// configuration, and delegates to the scenario with a representative coordinate of
// the fiche. Behaviour is unchanged — only extracted.
const GRID = buildGrid();

// >= 100 tier, a 7-indicator year: exercises the full compliance funnel (step 5)
// like the current suite baseline. The company workforce (200) drives the CSE and
// compliance obligations; the baseline GIP workforce (>= 250) drives the funnel.
function complianceCoordinate(fiche: string) {
	return pickCoordinate(GRID, { fiche, effmax: "249", year: 2027 });
}

// === GROUP A: No gap — auto-redirects ===

test.describe("[CAS-02] Path 1: no gap + hasCse → /avis-cse → full CSE flow", () => {
	const coordinate = complianceCoordinate("CAS-02");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("no-gap declaration, then full CSE opinion flow", async ({ page }) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-02"]({ page, coordinate });
	});
});

test.describe("[CAS-01] Path 2: no gap + no hasCse → /confirmation", () => {
	const coordinate = complianceCoordinate("CAS-01");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("no-gap declaration completes and /avis-cse stays unreachable", async ({
		page,
	}) => {
		await FICHE_SCENARIOS["CAS-01"]({ page, coordinate });
	});
});

// === GROUP B: Gap — compliance choice form ===

test.describe("[CAS-04] Path 3: gap + hasCse → compliance choice → justify", () => {
	const coordinate = complianceCoordinate("CAS-04");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("gap declaration → 3 options → justify → CSE opinion with two columns", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-04"]({ page, coordinate });
	});
});

test.describe("[CAS-06] Path 4: gap + hasCse → joint evaluation → /avis-cse", () => {
	const coordinate = complianceCoordinate("CAS-06");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("gap declaration → joint evaluation → CSE opinion deposited", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-06"]({ page, coordinate });
	});
});

test.describe("[CAS-05] Path 5: gap + no hasCse → joint evaluation → /confirmation", () => {
	const coordinate = complianceCoordinate("CAS-05");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("gap declaration → joint evaluation → /confirmation", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-05"]({ page, coordinate });
	});
});

test.describe("[CAS-03] Path 5.b: gap + no hasCse → justify → /confirmation", () => {
	const coordinate = complianceCoordinate("CAS-03");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("justify without CSE completes the démarche directly", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-03"]({ page, coordinate });
	});
});

test.describe("[ANX-01] Path change before downstream action — tâtonnement supported", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("user explores corrective_action then switches to joint_evaluation: both events persisted, latest wins", async ({
		page,
	}) => {
		await completeDeclaration(page, { hasGap: true });
		await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 10_000 });

		await selectCompliancePath(page, "path-corrective");
		await page.waitForURL(urlGlob(complianceStepHref(1)), { timeout: 10_000 });

		expect(await countPathChoiceEventsRound1()).toBe(1);
		expect(await lastPathChoiceValueRound1()).toBe("corrective_action");

		await selectCompliancePath(page, "path-joint");
		await page.waitForURL(urlGlob(COMPLIANCE_JOINT_EVALUATION), {
			timeout: 10_000,
		});

		expect(await countPathChoiceEventsRound1()).toBe(2);
		expect(await lastPathChoiceValueRound1()).toBe("joint_evaluation");
	});
});

// === GROUP C: Corrective action — second declaration (no remaining gap) ===

test.describe("[CAS-08] Path 6: gap + corrective action (no gap after) + hasCse → /avis-cse", () => {
	const coordinate = complianceCoordinate("CAS-08");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("corrective action → no gap → CSE opinion on both declarations", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-08"]({ page, coordinate });
	});
});

test.describe("[CAS-07] Path 7: gap + corrective action (no gap after) + no hasCse → /confirmation", () => {
	const coordinate = complianceCoordinate("CAS-07");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("corrective action → no gap → /confirmation", async ({ page }) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-07"]({ page, coordinate });
	});
});

// === GROUP D: Corrective action with remaining gap → second round ===

test.describe("[CAS-10] Path 8: gap + corrective action (gap persists) → second round choices", () => {
	const coordinate = complianceCoordinate("CAS-10");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("second round → justify → CSE opinion on both declarations with justification", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-10"]({ page, coordinate });
	});
});

test.describe("[CAS-09] Path 9: second round + justify + no hasCse → /confirmation", () => {
	const coordinate = complianceCoordinate("CAS-09");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("full flow → second round → justify → /confirmation", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-09"]({ page, coordinate });
	});
});

test.describe("[CAS-12] Path 10: second round + joint evaluation + hasCse → /avis-cse", () => {
	const coordinate = complianceCoordinate("CAS-12");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("full flow → second round → joint evaluation → CSE opinion on both", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-12"]({ page, coordinate });
	});
});

test.describe("[CAS-11] Path 11: second round + joint evaluation + no hasCse → /confirmation", () => {
	const coordinate = complianceCoordinate("CAS-11");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("full flow → second round → joint evaluation → /confirmation", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-11"]({ page, coordinate });
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
		await page.waitForURL(urlGlob(cseOpinionStepHref(1)), { timeout: 10_000 });
		await page.getByRole("link", { name: /Précédent/ }).click();
		await page.waitForURL(urlGlob(remunerationStepHref(6)), {
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
		await page.waitForURL(urlGlob(cseOpinionStepHref(1)), { timeout: 10_000 });
		await page.getByRole("link", { name: /Précédent/ }).click();
		await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 10_000 });
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
		await page.waitForURL(urlGlob(cseOpinionStepHref(1)), { timeout: 10_000 });
		await page.getByRole("link", { name: /Précédent/ }).click();
		await page.waitForURL(urlGlob(complianceStepHref(3)), { timeout: 10_000 });
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
		test.slow();
		// Complete declaration without gap → auto-redirect to CSE → complete CSE
		await completeDeclaration(page, { hasGap: false });
		await page.waitForURL(urlGlob(`${CSE_OPINION}/**`), { timeout: 10_000 });
		await fillCseStep1(page, { firstDeclGapCardHidden: true });
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

// === GROUP I: tranches < 100 — the gap ≥ 5 % obligations stop at 100 salariés ===
// Arbitrage 2026-07 (#4043, cahier de tests §6): the voluntary tier (< 50) declares
// all 7 indicators every year, the 50-99 tier declares the 6 first ones outside its
// own indicator G years, and neither owes anything when a gap ≥ 5 % shows up. The
// [CAS-14] probe declares a CSE on purpose: isCseOpinionRequired is an AND of the
// effectif and the CSE, so it fails if the 100-salarié gate ever disappears. Each
// describe restores the file's exit state (GIP >= 250 + hasCse true) after it.

test.describe("[CAS-13] 7 indicators + GIP 30 (< 50) + no gap → direct completion", () => {
	const coordinate = pickCoordinate(GRID, {
		fiche: "CAS-13",
		effmax: "49",
		year: 2027,
	});

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setGipWorkforce(coordinate.workforce);
		await setCompanyHasCse(null);
	});

	test.afterAll(async () => {
		await resetGipWorkforce();
		await setCompanyHasCse(true);
	});

	test("declares the 7 indicators and completes the démarche directly", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-13"]({ page, coordinate });
	});
});

test.describe("[CAS-14] 7 indicators + GIP 30 (< 50) + gap ≥ 5 % → no obligation triggered", () => {
	const coordinate = pickCoordinate(GRID, {
		fiche: "CAS-14",
		effmax: "49",
		year: 2027,
	});

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setGipWorkforce(coordinate.workforce);
		await setCompanyHasCse(null);
	});

	test.afterAll(async () => {
		await resetGipWorkforce();
		await setCompanyHasCse(true);
	});

	test("submits into a direct completion, with every compliance surface out of reach", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-14"]({ page, coordinate });
	});
});

// The cahier describes this case on the 6-indicator variant, which is what the 50-99
// tier declares outside its own indicator G years. On those years (2030, 2033, …) the
// same company declares the 7 indicators instead, so the funnel shape is read from the
// domain — what is under test either way is the outcome: below 100 salariés a gap-free
// declaration completes the démarche directly, with no compliance obligation.
test.describe("[CAS-13-6IND] GIP 75 (50-99) → direct completion", () => {
	const coordinate = pickCoordinate(GRID, {
		fiche: "CAS-13-6IND",
		effmax: "99",
		year: 2027,
	});

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setGipWorkforce(coordinate.workforce);
		await setCompanyHasCse(null);
	});

	test.afterAll(async () => {
		await resetGipWorkforce();
		await setCompanyHasCse(true);
	});

	test("submits the tier's funnel and completes the démarche directly", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-13-6IND"]({ page, coordinate });
	});
});

test.describe("[S11] CAS-04 with défavorable opinion — routing unchanged, opinion retained", () => {
	test.describe.configure({ mode: "serial" });

	const coordinate = complianceCoordinate("CAS-04");
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(coordinate.hasCse);
		await setCompanyWorkforce(coordinate.workforce);
	});

	test("défavorable opinion reaches the same fin-de-démarche as favorable", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-04"]({
			page,
			coordinate,
			opinion: "unfavorable",
		});
	});

	test("step-1 recap shows Défavorable as the selected opinion", async ({
		page,
	}) => {
		await page.goto(cseOpinionStepHref(1));
		await page.waitForURL(urlGlob(cseOpinionStepHref(1)), { timeout: 10_000 });
		await expect(
			page.locator("#first-decl-accuracy-unfavorable"),
		).toBeChecked();
	});

	test("transmitted PDF endpoint returns a valid PDF for défavorable opinion", async ({
		page,
	}) => {
		const response = await page.request.get(API_TRANSMITTED_PDF);
		expect(response.ok()).toBe(true);
		expect(response.headers()["content-type"]).toContain("application/pdf");
	});
});

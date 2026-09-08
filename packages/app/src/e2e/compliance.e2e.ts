import type { ChildProcess } from "node:child_process";
import { expect, test } from "@playwright/test";
import { buildGrid, pickCoordinate } from "./grille/coordinates";
import { FICHE_SCENARIOS } from "./grille/scenarios";
import { withCampaignYear } from "./helpers/campaign-year";
import {
	COMPLIANCE_PATH,
	completeSecondDeclaration,
	fillCseStep1,
	selectCompliancePath,
	submitCseStep2,
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
	reachStep6ComplianceRecap,
} from "./helpers/declaration-flows";
import {
	killWorker,
	spawnNotificationsWorker,
	waitForWorkerReady,
} from "./helpers/notifications-worker";
import { mailChainAvailable } from "./helpers/receipts";

test.describe.configure({ mode: "serial" });

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
		test.slow();
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
// Whether the funnel carries the categories step (step 5 / indicator G) is decided
// by isIndicatorGRequired(workforce, year): below 250 it only applies on the
// triennial cadence (base 2027), and — from 2030 — down to every mandatory 50+
// company. Each 6-indicator fiche pins its campaign year through the coordinate it
// receives (year 2029, workforce 120), so both branches stay exercised.

test.describe("[CAS-01-6IND] Path 14: 6 indicators (no G) + no hasCse → direct completion", () => {
	const coordinate = pickCoordinate(GRID, {
		fiche: "CAS-01-6IND",
		effmax: "149",
		year: 2029,
	});

	test("submits the tier's funnel and completes the démarche directly", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-01-6IND"]({ page, coordinate });
	});
});

test.describe("[CAS-02-6IND] Path 15: 6 indicators (no G) + hasCse → /avis-cse", () => {
	const coordinate = pickCoordinate(GRID, {
		fiche: "CAS-02-6IND",
		effmax: "149",
		year: 2029,
	});

	test("submits the tier's funnel then deposits the CSE accuracy opinion", async ({
		page,
	}) => {
		test.slow();
		await FICHE_SCENARIOS["CAS-02-6IND"]({ page, coordinate });
	});
});

// ANX-04 — the OTHER branch of CAS-01/02-6IND: the same 100-149 company gains step 5
// in a triennial year from 2030 — the assertion that would have silently broken
// without #4067. Kept lightweight (funnel shape only): the full compliance flows
// for a 7-indicator company are already covered by the >= 250 baseline cases.
const SEVEN_INDICATOR_YEAR = 2030;

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

// ANX-05 — the 50-99 tranche (scenarios S1/S2 of #4067): indicator G is absent
// below 2030 and returns only in a triennial year from 2030.
const SIX_INDICATOR_YEAR = 2029;

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
// A company >= 100 that declared it has no CSE (hasCse false or null) must no longer
// be told to deposit a CSE opinion: the recap "Prochaines étapes" box and the
// compliance-choice options drop every CSE-opinion mention, while the gap actions
// and the "Mettre à jour l'existence d'un CSE" escape hatch stay.
//
// Only the `false` branch is reachable end to end. Since #3952 the funnel layout
// intercepts a >= 100 company whose CSE answer is still null and sends it back to
// /mon-espace to answer, so no journey reaches the recap in that state — that bounce
// is asserted in missing-info-modal.e2e.ts, and the recap's own null-like-false
// rendering by Step6Review.test.tsx ("CSE consultation section gating (issue #3945)").

const CSE_OPINION_RECAP_TEXT = /avis du CSE devra être transmis/;
const CSE_JUSTIFY_PARENTHESIS =
	/avis à transmettre lors de la dernière étape de la démarche/;
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
		test.slow();
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
		test.slow();
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

test.describe("[#3945] gap + workforce >= 100 + hasCse=true → CSE opinion still shown", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("step 6 recap shows the CSE opinion mention", async ({ page }) => {
		test.slow();
		await reachStep6ComplianceRecap(page);

		await expect(
			page.getByRole("heading", { name: "Informer et consulter le CSE" }),
		).toBeVisible();
		await expect(page.getByText(CSE_OPINION_RECAP_TEXT)).toBeVisible();
		await expect(page.getByText(CSE_JUSTIFY_PARENTHESIS)).toBeVisible();

		// First declaration renders both alternative paths, each prefixed "Soit"
		await expect(
			page.getByText(/Soit mettre en place des actions correctives/),
		).toBeVisible();
		await expect(
			page.getByText(
				"Soit réaliser une évaluation conjointe des rémunérations",
			),
		).toBeVisible();
	});

	test("compliance choice page keeps the CSE opinion bullet", async ({
		page,
	}) => {
		test.slow();
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
		await page.goto("/avis-cse/etape/1");
		await page.waitForURL("**/avis-cse/etape/1", { timeout: 10_000 });
		await expect(
			page.locator("#first-decl-accuracy-unfavorable"),
		).toBeChecked();
	});

	test("transmitted PDF endpoint returns a valid PDF for défavorable opinion", async ({
		page,
	}) => {
		const response = await page.request.get("/api/transmitted-pdf");
		expect(response.ok()).toBe(true);
		expect(response.headers()["content-type"]).toContain("application/pdf");
	});
});

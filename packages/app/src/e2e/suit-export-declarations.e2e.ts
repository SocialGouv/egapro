import { expect, test } from "@playwright/test";
import { urlGlob } from "~/e2e/helpers/routes";
import { COMPLIANCE_CONFIRMATION, COMPLIANCE_PATH } from "~/modules/routes";
import { TEST_GIP_WORKFORCE } from "./constants";
import { selectCompliancePath } from "./helpers/compliance-flows";
import {
	resetDeclarationToDraft,
	resetGipWorkforce,
	setCompanyHasCse,
	setCompanyWorkforce,
} from "./helpers/db";
import {
	completeDeclaration,
	DEFAULT_ANNUAL_QUARTILES,
	DEFAULT_HOURLY_QUARTILES,
	STEP1_WORKFORCE,
} from "./helpers/declaration-flows";
import {
	fetchActiveSuitDeclaration,
	suitExportStatusWithoutSecret,
} from "./helpers/suit-export";

/**
 * End-to-end contract test for the SUIT declarations export
 * (`GET /api/v1/export/declarations`), the machine API consumed by the SUIT
 * gateway (bug #3950 — « choix justification écart sans CSE » ; epic #4122 —
 * objet `Parcours` et `Prochaines_etapes_possibles`).
 *
 * Two contracts ride on the same declaration, replayed once through the real UI:
 *
 *  - `Historique_statuts`: the A–F stepper records internal `step_change` rows in
 *    the status history; these must never surface, and every exported entry must
 *    carry a human-readable `Libelle_statut`. This spec is the only place the
 *    `eventType != 'step_change'` SQL filter actually runs.
 *  - `Parcours` (v3.0.0): the deduced-journey object, whose
 *    `Prochaines_etapes_possibles` is evaluated against a live declaration row.
 *    Unit tests pin the rule engine on synthetic facts; only here is the
 *    advertised next step checked against the choice the UI really offers, and
 *    against the state the FSM really reaches once that choice is made.
 *  - `Indicateurs.F` (bug #4528): the quartile headcounts the funnel collected.
 *    Unit tests pin the mapping on a synthetic row, so they hold whichever
 *    column it reads; only a round-trip proves the exported figure is the one
 *    step 4 actually persisted — the very link whose absence was the bug.
 *  - Indicator G computed gaps (merged from `export-declarations.e2e.ts`, #4114):
 *    non-regression guard for #3942 and #4205. The indicator G (indicateur 7)
 *    categories used to serialize only the raw declared amounts, never the computed
 *    pay gaps. #3942 added the per-category `*_ecart` fields; #4205 then deliberately
 *    dropped the two `*_total_ecart` fields (the total-row gap was removed from the
 *    declaration UI as it is decorative and enters no business rule), leaving four
 *    `*_ecart` fields per category. #4368 then added a headcount pair per pay basis.
 *    Only the real select → serialize chain rules out a column dropped in `queries.ts`.
 *
 * The former `export-declarations.e2e.ts` replayed its own full 6-step funnel to reach
 * the same endpoint; folding it in here drops one complete tunnel from the suite.
 */

test.describe.configure({ mode: "serial" });

// The four computed gap fields the export must expose per indicator G category.
const ECART_KEYS = [
	"Rem_annuelle_base_ecart",
	"Rem_annuelle_variable_ecart",
	"Taux_horaire_base_ecart",
	"Taux_horaire_variable_ecart",
] as const;

// Dropped in #4205: the total-row gap is decorative and enters no business
// rule, so the export contract no longer exposes these two fields.
const REMOVED_ECART_KEYS = [
	"Rem_annuelle_total_ecart",
	"Taux_horaire_total_ecart",
] as const;

// The FSM states this spec walks the declaration through.
const AWAITING_PATH_CHOICE = "awaiting_compliance_path_choice";
const DEMARCHE_COMPLETED = "demarche_completed";

// Mirror of DECLARATION_EVENT_TYPE_LABELS keys — the only status values the
// public contract is allowed to emit. `step_change` is deliberately absent.
const PUBLIC_STATUTS = new Set([
	"submit",
	"path_choice",
	"second_declaration_submit",
	"joint_evaluation_submit",
	"cse_opinion_submit",
	"cancel",
	"demarche_complete",
]);

test.describe("SUIT export declarations — machine contract (bugs #3950, epic #4122)", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
		await setCompanyWorkforce(200);
		// The exported `Effectif` reads the GIP row, not `app_company.workforce`, and no
		// earlier spec is obliged to leave it at the suite baseline — pin it, or the
		// segmentation assertions below depend on whichever file ran last.
		await resetGipWorkforce();
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
	});

	test("completes a declaration with a gap and reaches the compliance path choice", async ({
		page,
	}) => {
		test.slow(); // Full 6-step declaration
		await completeDeclaration(page, { hasGap: true });
		// Gap → compliance choice page; the justify option records a path_choice
		// event and, once the A–F stepper has run, the history carries internal
		// step_change rows that the export must strip.
		await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 10_000 });
	});

	// The declaration submitted just above is the one these two read back: the funnel
	// fills category 1's four pay measures with the same women 1000 / men 1100 pair, so
	// no second tunnel is needed to observe the serialized gaps.
	test("emits the four *_ecart fields per indicator G category with the signed (H−F)/H convention and no total gap", async ({
		browser,
	}) => {
		const declaration = await fetchActiveSuitDeclaration(browser);
		const categories = declaration.Indicateurs.G;
		expect(Array.isArray(categories)).toBe(true);
		expect(categories.length).toBeGreaterThan(0);

		// Every category must carry the four computed-gap fields (the #3942
		// bug: absent) and must NOT carry the two total-gap fields dropped
		// in #4205 (regression guard for the deliberate contract change).
		for (const category of categories) {
			for (const key of ECART_KEYS) {
				expect(category).toHaveProperty(key);
				// SUIT reads the gaps as fixed-scale strings like A–F: a number would drop trailing zeros.
				if (category[key] !== null) {
					expect(category[key]).toMatch(/^-?\d+\.\d{4}$/);
				}
			}
			for (const key of REMOVED_ECART_KEYS) {
				expect(category).not.toHaveProperty(key);
			}
		}

		// The funnel fills category 1's four pay measures with the same
		// women 1000 / men 1100 pair (since #3948 a headcount >= 1 requires
		// all four amounts). Numeric strings keep their DB scale ("1100.00"),
		// so compare on the parsed value.
		const filled = categories.find(
			(c: { Rem_annuelle_base_H: string | null }) =>
				c.Rem_annuelle_base_H !== null &&
				Number(c.Rem_annuelle_base_H) === 1100,
		);
		expect(filled).toBeDefined();

		// Every measure carries the same pair, so every remaining gap is the
		// same: (1100 − 1000) / 1100 = 0.0909, rounded to 4 decimals.
		for (const key of ECART_KEYS) {
			expect(filled?.[key]).toBe("0.0909");
		}
	});

	// #4368 — the contract gained a headcount pair per pay basis. `queries.ts` names
	// the exported columns one by one, so a column dropped there reaches the client as
	// a missing field while every DB-mocking unit test stays green; only the real
	// select → serialize chain rules that out. The funnel holds both bases to the same
	// step 1 totals, so which source column feeds which field stays the unit test's
	// question — this one answers whether they survive the chain at all.
	test("carries the physical headcount of both pay bases per indicator G category", async ({
		browser,
	}) => {
		const declaration = await fetchActiveSuitDeclaration(browser);

		const filled = declaration.Indicateurs.G.find(
			(c: { Effectif_F: number | null }) => c.Effectif_F !== null,
		);
		expect(filled).toBeDefined();

		expect(filled?.Effectif_F).toBe(STEP1_WORKFORCE.women);
		expect(filled?.Effectif_H).toBe(STEP1_WORKFORCE.men);
		expect(filled?.Effectif_horaire_F).toBe(STEP1_WORKFORCE.women);
		expect(filled?.Effectif_horaire_H).toBe(STEP1_WORKFORCE.men);
	});

	test("Parcours advertises exactly the transitions the compliance page offers", async ({
		page,
		browser,
	}) => {
		await page.goto(COMPLIANCE_PATH);
		const offeredInUi = ["path-justify", "path-corrective", "path-joint"];
		for (const optionId of offeredInUi) {
			await expect(page.locator(`label[for="${optionId}"]`)).toBeVisible();
		}

		const declaration = await fetchActiveSuitDeclaration(browser);
		const parcours = declaration.Parcours;

		// v3.0.0 moved the deduced fields under `Parcours` with no deprecated twin left
		// at the root — a SUIT client still reading the old shape must break loudly.
		for (const legacyKey of [
			"Effectif",
			"Annee",
			"Statut",
			"Parcours_de_conformite_requis",
			"Parcours_de_conformite_revision_requis",
			"Avis_CSE_requis",
			"Indicateur_G_requis",
			"Version_regles",
		]) {
			expect(declaration[legacyKey], `${legacyKey} left at the root`).toBe(
				undefined,
			);
		}

		expect(parcours.Effectif).toBe(TEST_GIP_WORKFORCE);
		expect(parcours.Tranche_effectif).toBe("250+");
		expect(parcours.Regime_obligations).toBe("mandatory_with_compliance");
		expect(parcours.Statut).toBe(AWAITING_PATH_CHOICE);
		expect(parcours.Annulee).toBe(false);
		expect(declaration.Date_annulation).toBeNull();
		expect(parcours.Parcours_de_conformite_requis).toBe(true);
		expect(parcours.Indicateur_G_requis).toBe(true);
		// The company answered "no CSE", so the snapshot taken at submission is false —
		// which is what prunes the `with_cse` variant from the transitions below.
		expect(parcours.Avis_CSE_requis).toBe(false);
		expect(parcours).not.toHaveProperty("Version_regles");

		const nextSteps = parcours.Prochaines_etapes_possibles;
		expect(
			nextSteps.map((step) => step.Identifiant_transition).sort(),
			"one advertised transition per option the page renders, the with-CSE justify variant pruned by the decided guard",
		).toEqual([
			"choose_path_initial_corrective_action",
			"choose_path_initial_joint_evaluation",
			"choose_path_initial_justify_without_cse",
		]);

		for (const step of nextSteps) {
			expect(step.Action).toBe("choose_compliance_path");
			expect(typeof step.Libelle).toBe("string");
			expect((step.Libelle as string).length).toBeGreaterThan(0);
		}

		// The prediction the next test then executes for real.
		const justify = nextSteps.find(
			(step) =>
				step.Identifiant_transition ===
				"choose_path_initial_justify_without_cse",
		);
		expect(justify?.Etat_cible).toBe(DEMARCHE_COMPLETED);
		expect(justify?.Libelle).toBe(
			"Finalisation - Démarche des indicateurs de rémunération",
		);
	});

	test("records the justify path choice and completes the démarche", async ({
		page,
	}) => {
		await selectCompliancePath(page, "path-justify");
		// Without a CSE the justify choice completes the démarche immediately
		// (FSM transition choose_path_initial_justify_without_cse) — the user lands on
		// the confirmation page, not on the /avis-cse deposit flow.
		await page.waitForURL(urlGlob(COMPLIANCE_CONFIRMATION), {
			timeout: 10_000,
		});
	});

	test("gateway request without the shared secret is rejected with 403", async ({
		browser,
	}) => {
		expect(await suitExportStatusWithoutSecret(browser)).toBe(403);
	});

	test("Historique_statuts excludes internal step_change events and always carries a Libelle_statut", async ({
		browser,
	}) => {
		const declaration = await fetchActiveSuitDeclaration(browser);

		const history = declaration.Historique_statuts;
		expect(Array.isArray(history)).toBe(true);
		expect(history.length).toBeGreaterThan(0);

		// The internal step_change rows recorded by the A–F stepper must not leak.
		expect(history.some((entry) => entry.Statut === "step_change")).toBe(false);

		for (const entry of history) {
			expect(PUBLIC_STATUTS.has(entry.Statut)).toBe(true);
			expect(typeof entry.Libelle_statut).toBe("string");
			expect((entry.Libelle_statut as string).length).toBeGreaterThan(0);
		}

		// The submission and the justify path choice are materialised in the
		// machine contract with their public labels.
		const statuts = history.map((entry) => entry.Statut);
		expect(statuts).toContain("submit");
		expect(statuts).toContain("path_choice");

		const pathChoice = history.find((entry) => entry.Statut === "path_choice");
		expect(pathChoice?.Libelle_statut).toBe(
			"Choix du parcours — Justification de l'écart",
		);
	});

	test("Indicateurs.F exports the quartile headcounts step 4 recorded", async ({
		browser,
	}) => {
		const { F } = (await fetchActiveSuitDeclaration(browser)).Indicateurs;

		DEFAULT_ANNUAL_QUARTILES.forEach((row, index) => {
			const quartile = index + 1;
			expect(
				F.annuel[`Quartile${quartile}_Rem_globale_annuelle_nb_F`],
				`annual quartile ${quartile} women headcount`,
			).toBe(Number(row.women));
			expect(
				F.annuel[`Quartile${quartile}_Rem_globale_annuelle_nb_H`],
				`annual quartile ${quartile} men headcount`,
			).toBe(Number(row.men));
		});

		DEFAULT_HOURLY_QUARTILES.forEach((row, index) => {
			const quartile = index + 1;
			expect(
				F.horaire[`Quartile${quartile}_Taux_horaire_global_nb_F`],
				`hourly quartile ${quartile} women headcount`,
			).toBe(Number(row.women));
			expect(
				F.horaire[`Quartile${quartile}_Taux_horaire_global_nb_H`],
				`hourly quartile ${quartile} men headcount`,
			).toBe(Number(row.men));
		});
	});

	test("Parcours follows the FSM into demarche_completed", async ({
		browser,
	}) => {
		const parcours = (await fetchActiveSuitDeclaration(browser)).Parcours;

		expect(parcours.Statut).toBe(DEMARCHE_COMPLETED);
		expect(parcours.Annulee).toBe(false);
		// This company answered "no CSE", so nothing is owed from the terminal
		// state. The ruleset still accepts submit_cse_opinion here — unguarded, to
		// cover a company that gains a CSE later — but the export does not advertise
		// an opinion to a control authority when none is required.
		expect(parcours.Avis_CSE_requis).toBe(false);
		expect(parcours.Prochaines_etapes_possibles).toEqual([]);
	});
});

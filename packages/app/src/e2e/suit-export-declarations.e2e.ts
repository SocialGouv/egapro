import { expect, test } from "@playwright/test";
import { TEST_GIP_WORKFORCE } from "./constants";
import {
	COMPLIANCE_PATH,
	selectCompliancePath,
} from "./helpers/compliance-flows";
import {
	resetDeclarationToDraft,
	resetGipWorkforce,
	setCompanyHasCse,
	setCompanyWorkforce,
} from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";
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
 */

test.describe.configure({ mode: "serial" });

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

	test("completes a declaration with a gap and reaches the compliance path choice", async ({
		page,
	}) => {
		test.slow(); // Full 6-step declaration
		await completeDeclaration(page, { hasGap: true });
		// Gap → compliance choice page; the justify option records a path_choice
		// event and, once the A–F stepper has run, the history carries internal
		// step_change rows that the export must strip.
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
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
		expect(typeof parcours.Version_regles).toBe("string");

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
		await page.waitForURL(`**${COMPLIANCE_PATH}/confirmation`, {
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

	test("Parcours follows the FSM into demarche_completed", async ({
		browser,
	}) => {
		const parcours = (await fetchActiveSuitDeclaration(browser)).Parcours;

		expect(parcours.Statut).toBe(DEMARCHE_COMPLETED);
		expect(parcours.Annulee).toBe(false);
		// The terminal state is not a dead end: the CSE opinion stays depositable, and
		// that is the only transition the ruleset still offers from here.
		expect(
			parcours.Prochaines_etapes_possibles.map(
				(step) => step.Identifiant_transition,
			),
		).toEqual(["submit_cse_opinion"]);
		expect(parcours.Prochaines_etapes_possibles[0]?.Etat_cible).toBe(
			DEMARCHE_COMPLETED,
		);
	});
});

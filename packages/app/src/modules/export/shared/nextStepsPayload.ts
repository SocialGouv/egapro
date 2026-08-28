import type { DeclarationFsmStatus } from "~/modules/domain";
import type { Rules } from "~/server/rules/engine";
import {
	listNextTransitions,
	loadRulesWithFallback,
	type NextTransition,
} from "~/server/rules/nextSteps";
import type { Predicate } from "~/server/rules/schema";

export type NextStepPayload = {
	Identifiant_transition: string;
	Action: string;
	Etat_cible: DeclarationFsmStatus;
	Libelle: string | null;
	Condition?: string;
};

function isCompositePredicate(node: Predicate): boolean {
	return "all" in node || "any" in node || "not" in node;
}

function renderFragment(
	node: Predicate,
	thresholds: Record<string, number>,
): string {
	if ("all" in node) {
		return node.all.map((child) => renderChild(child, thresholds)).join(" et ");
	}
	if ("any" in node) {
		return node.any.map((child) => renderChild(child, thresholds)).join(" ou ");
	}
	if ("not" in node) {
		return `non (${renderFragment(node.not, thresholds)})`;
	}
	if ("compute" in node) {
		return node.compute;
	}

	const { fact, op } = node;
	if (op === "isNull") return `${fact} est nul`;
	if (op === "isNotNull") return `${fact} est renseigné`;

	if (fact === "action.stillHasGap" && op === "==" && "value" in node) {
		if (node.value === true) {
			return `l'écart persiste (≥ ${thresholds.gapAlertPercent} %)`;
		}
		if (node.value === false) {
			return `l'écart est résorbé (< ${thresholds.gapAlertPercent} %)`;
		}
	}

	const symbol = op === "==" ? "=" : op === "!=" ? "≠" : op;
	const target = "value" in node ? node.value : thresholds[node.threshold];
	return `${fact} ${symbol} ${target}`;
}

function renderChild(
	node: Predicate,
	thresholds: Record<string, number>,
): string {
	const fragment = renderFragment(node, thresholds);
	return isCompositePredicate(node) ? `(${fragment})` : fragment;
}

function resolveTargetStageLabel(
	rules: Rules,
	targetStatus: DeclarationFsmStatus,
): string | null {
	const state = rules.states.find((s) => s.id === targetStatus);
	if (state?.stage == null) return null;
	return rules.stages.find((stage) => stage.id === state.stage)?.name ?? null;
}

function toNextStepPayload(
	transition: NextTransition,
	rules: Rules,
): NextStepPayload {
	const base: NextStepPayload = {
		Identifiant_transition: transition.id,
		Action: transition.action,
		Etat_cible: transition.to,
		Libelle: resolveTargetStageLabel(rules, transition.to),
	};

	if (transition.residualGuard === null) return base;

	return {
		...base,
		Condition: `si ${renderFragment(transition.residualGuard, rules.thresholds)}`,
	};
}

/**
 * The ruleset is an ACCEPT-set: it stays permissive on purpose, so a late or
 * repeated action is tolerated rather than rejected. `Prochaines_etapes_possibles`
 * is an EXPECT-set: what a control authority should look for next. The two
 * differ in exactly two places, both pruned here.
 *
 * 1. `submit_cse_opinion` is left unguarded because `cse_required` is a
 *    snapshot taken at submission: a company that gains a CSE afterwards must
 *    still be able to file its opinion without reopening a completed démarche
 *    (see `cseRequirementSync.ts`). Advertising it to a company that owes no
 *    opinion reads as an outstanding obligation.
 *
 * 2. `submit_second_declaration` also fires from `awaiting_revision_choice`, so
 *    a company may resubmit its correction while parked there. But the app
 *    routes that state to the compliance-path screen
 *    (`complianceNavigation.ts`), never back into the second-declaration
 *    funnel: the expected next step is the path choice, not a resubmission.
 *
 * Both prunings are export-only — `applyAction` still accepts either action.
 * Keep this list at two: a third entry would make it a de facto mirror of the
 * state graph, which `CLAUDE.md` forbids. A third case belongs in the ruleset.
 *
 * Note on `action.stillHasGap`, which stays deliberately undecided. The router
 * derives it from the stored `correction` categories, so it looks like a known
 * fact — but `hasGapsAboveThreshold` is a `.some()`, and the only state left
 * advertising `submit_second_declaration` is `corrective_actions_chosen`, where
 * no correction row exists yet. Feeding it in would read "no rows" as "gap
 * resolved" and promise an outcome the company has not produced. It is a real
 * unknown there, and `Condition` is the right way to say so.
 */
function isAdvertisable(
	transition: { action: string },
	status: DeclarationFsmStatus,
	cseRequired: boolean,
): boolean {
	if (transition.action === "submit_cse_opinion") return cseRequired;
	if (transition.action === "submit_second_declaration") {
		return status !== "awaiting_revision_choice";
	}
	return true;
}

export function buildNextStepsPayload(input: {
	status: DeclarationFsmStatus;
	rulesVersion: string | null;
	cseRequired: boolean;
	cancelled: boolean;
}): NextStepPayload[] {
	if (input.cancelled) return [];

	const rules = loadRulesWithFallback(input.rulesVersion);
	const transitions = listNextTransitions(rules, input.status, {
		cseRequired: input.cseRequired,
	});

	return transitions
		.filter((transition) =>
			isAdvertisable(transition, input.status, input.cseRequired),
		)
		.map((transition) => toNextStepPayload(transition, rules));
}

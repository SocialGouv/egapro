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
 * `submit_cse_opinion` is the one CSE transition the ruleset leaves unguarded,
 * and deliberately so: `cse_required` is a snapshot taken at submission, and a
 * company that gains a CSE afterwards must still be able to file its opinion
 * without reopening a completed démarche (see `cseRequirementSync.ts`). The
 * engine therefore keeps accepting the action whatever the snapshot says.
 *
 * That permissiveness is an accept-set, not an expectation. Advertising the
 * step to a control authority for a company that has no CSE reads as an
 * outstanding obligation, so the export prunes it here — at the export layer
 * only, leaving `applyAction` free to accept the late deposit.
 */
function isAdvertisable(
	transition: { action: string },
	cseRequired: boolean,
): boolean {
	return cseRequired || transition.action !== "submit_cse_opinion";
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
		.filter((transition) => isAdvertisable(transition, input.cseRequired))
		.map((transition) => toNextStepPayload(transition, rules));
}

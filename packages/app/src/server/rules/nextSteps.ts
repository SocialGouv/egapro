import type { DeclarationFsmStatus } from "~/modules/domain";
import {
	type Facts,
	isKnownRulesVersion,
	loadRules,
	type Rules,
} from "./engine";
import type { Predicate } from "./schema";

export const DEFAULT_RULES_VERSION = "2027.1";

export type NextTransition = {
	id: string;
	action: string;
	to: DeclarationFsmStatus;
	/** Guard branches left undecided by the known facts, pruned of everything already decided. `null` when the guard is fully decided or absent. */
	residualGuard: Predicate | null;
};

type Kleene = true | false | "unknown";

type Evaluation = { value: Kleene; residual: Predicate | null };

type EvaluationContext = {
	facts: Facts;
	computations: Record<string, unknown>;
	thresholds: Record<string, number>;
};

const DECIDED_TRUE: Evaluation = { value: true, residual: null };
const DECIDED_FALSE: Evaluation = { value: false, residual: null };

function decided(value: boolean): Evaluation {
	return value ? DECIDED_TRUE : DECIDED_FALSE;
}

function resolveFactValue(facts: Facts, path: string): unknown {
	const parts = path.split(".");
	let current: unknown = facts;
	for (const part of parts) {
		if (current === null || current === undefined) return undefined;
		current = (current as Record<string, unknown>)[part];
	}
	return current;
}

function resolveCompareValue(
	node: Record<string, unknown>,
	thresholds: Record<string, number>,
): number | string | boolean | null | undefined {
	if ("value" in node) return node.value as number | string | boolean | null;
	if ("threshold" in node && typeof node.threshold === "string") {
		return thresholds[node.threshold];
	}
	return undefined;
}

function pruneResiduals(
	kind: "all" | "any",
	undecided: Evaluation[],
): Predicate | null {
	const residuals = undecided
		.map((child) => child.residual)
		.filter((residual): residual is Predicate => residual !== null);
	const [first] = residuals;
	if (first === undefined) return null;
	if (residuals.length === 1) return first;
	return kind === "all" ? { all: residuals } : { any: residuals };
}

function evaluateNode(node: unknown, ctx: EvaluationContext): Evaluation {
	if (node === null || node === undefined) return DECIDED_TRUE;
	const n = node as Record<string, unknown>;

	if ("all" in n && Array.isArray(n.all)) {
		const children = n.all.map((child) => evaluateNode(child, ctx));
		if (children.some((child) => child.value === false)) return DECIDED_FALSE;
		const undecided = children.filter((child) => child.value === "unknown");
		if (undecided.length === 0) return DECIDED_TRUE;
		return { value: "unknown", residual: pruneResiduals("all", undecided) };
	}

	if ("any" in n && Array.isArray(n.any)) {
		const children = n.any.map((child) => evaluateNode(child, ctx));
		if (children.some((child) => child.value === true)) return DECIDED_TRUE;
		const undecided = children.filter((child) => child.value === "unknown");
		if (undecided.length === 0) return DECIDED_FALSE;
		return { value: "unknown", residual: pruneResiduals("any", undecided) };
	}

	if ("not" in n) {
		const inner = evaluateNode(n.not, ctx);
		if (inner.value !== "unknown") return decided(!inner.value);
		return {
			value: "unknown",
			residual:
				inner.residual === null ? null : ({ not: inner.residual } as Predicate),
		};
	}

	if ("compute" in n && typeof n.compute === "string") {
		const computation = ctx.computations[n.compute];
		if (computation === undefined) {
			throw new Error(`Unknown computation: "${n.compute}"`);
		}
		const inner = evaluateNode(computation, ctx);
		if (inner.value !== "unknown") return decided(inner.value);
		return { value: "unknown", residual: n as Predicate };
	}

	if ("fact" in n && typeof n.fact === "string") {
		const factValue = resolveFactValue(ctx.facts, n.fact);
		if (factValue === undefined) {
			return { value: "unknown", residual: n as Predicate };
		}

		const op = n.op as string;
		if (op === "isNull") return decided(factValue === null);
		if (op === "isNotNull") return decided(factValue !== null);

		const compareTarget = resolveCompareValue(n, ctx.thresholds);

		switch (op) {
			case "==":
				return decided(factValue === compareTarget);
			case "!=":
				return decided(factValue !== compareTarget);
			case ">":
				return decided((factValue as number) > (compareTarget as number));
			case ">=":
				return decided((factValue as number) >= (compareTarget as number));
			case "<":
				return decided((factValue as number) < (compareTarget as number));
			case "<=":
				return decided((factValue as number) <= (compareTarget as number));
			case "in":
				return decided(Array.isArray(n.value) && n.value.includes(factValue));
			default:
				throw new Error(`Unknown operator: "${op}"`);
		}
	}

	throw new Error(`Unrecognized predicate node: ${JSON.stringify(n)}`);
}

export function loadRulesWithFallback(
	version: string | null | undefined,
): Rules {
	if (!version || !isKnownRulesVersion(version)) {
		return loadRules(DEFAULT_RULES_VERSION);
	}
	return loadRules(version);
}

export function listNextTransitions(
	rules: Rules,
	status: DeclarationFsmStatus,
	knownFacts: Facts,
): NextTransition[] {
	const ctx: EvaluationContext = {
		facts: knownFacts,
		computations: (rules.computations ?? {}) as Record<string, unknown>,
		thresholds: rules.thresholds,
	};

	const candidates: NextTransition[] = [];
	for (const transition of rules.transitions) {
		if (!transition.from.includes(status)) continue;

		const evaluation = evaluateNode(transition.guard, ctx);
		if (evaluation.value === false) continue;

		candidates.push({
			id: transition.id,
			action: transition.action,
			to: transition.to,
			residualGuard:
				evaluation.value === "unknown" ? evaluation.residual : null,
		});
	}
	return candidates;
}

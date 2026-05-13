import { type RuleEvent, type Rules, RulesSchema } from "./schema";
import rawV20271 from "./v2027.1.json";

export type { RuleEvent, Rules };

export type Facts = Record<string, unknown>;

type ComputationNode = unknown;

function getNestedValue(obj: Facts, path: string): unknown {
	const parts = path.split(".");
	let current: unknown = obj;
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

function evaluatePredicate(
	node: ComputationNode,
	facts: Facts,
	computations: Record<string, ComputationNode>,
	thresholds: Record<string, number>,
): boolean {
	if (node === null || node === undefined) return true;
	const n = node as Record<string, unknown>;

	if ("all" in n && Array.isArray(n.all)) {
		return (n.all as ComputationNode[]).every((child) =>
			evaluatePredicate(child, facts, computations, thresholds),
		);
	}
	if ("any" in n && Array.isArray(n.any)) {
		return (n.any as ComputationNode[]).some((child) =>
			evaluatePredicate(child, facts, computations, thresholds),
		);
	}
	if ("not" in n) {
		return !evaluatePredicate(
			n.not as ComputationNode,
			facts,
			computations,
			thresholds,
		);
	}
	if ("compute" in n && typeof n.compute === "string") {
		const comp = computations[n.compute];
		if (comp === undefined) {
			throw new Error(`Unknown computation: "${n.compute}"`);
		}
		return evaluatePredicate(comp, facts, computations, thresholds);
	}

	if ("fact" in n && typeof n.fact === "string") {
		const factValue = getNestedValue(facts, n.fact);
		const op = n.op as string;

		if (op === "isNull") return factValue === null || factValue === undefined;
		if (op === "isNotNull")
			return factValue !== null && factValue !== undefined;

		const compareTarget = resolveCompareValue(n, thresholds);

		switch (op) {
			case "==":
				return factValue === compareTarget;
			case "!=":
				return factValue !== compareTarget;
			case ">":
				return (factValue as number) > (compareTarget as number);
			case ">=":
				return (factValue as number) >= (compareTarget as number);
			case "<":
				return (factValue as number) < (compareTarget as number);
			case "<=":
				return (factValue as number) <= (compareTarget as number);
			case "in":
				return Array.isArray(n.value) && n.value.includes(factValue);
			default:
				throw new Error(`Unknown operator: "${op}"`);
		}
	}

	throw new Error(`Unrecognized predicate node: ${JSON.stringify(n)}`);
}

function matchesPayload(
	matchPayload: Record<string, unknown> | undefined,
	facts: Facts,
): boolean {
	if (!matchPayload) return true;
	for (const [key, expected] of Object.entries(matchPayload)) {
		if (getNestedValue(facts, `action.${key}`) !== expected) return false;
	}
	return true;
}

function runSanityChecks(rules: Rules): void {
	const stateIds = new Set(rules.states.map((s) => s.id));
	const stageIds = new Set(rules.stages.map((s) => s.id));
	const actionIds = rules.actions
		? new Set(rules.actions.map((a) => a.id))
		: undefined;
	const computationKeys = rules.computations
		? new Set(Object.keys(rules.computations))
		: new Set<string>();

	for (const state of rules.states) {
		if (state.stage !== null && !stageIds.has(state.stage)) {
			throw new Error(
				`State "${state.id}" references unknown stage ${state.stage}`,
			);
		}
	}

	for (const transition of rules.transitions) {
		for (const from of transition.from) {
			if (!stateIds.has(from)) {
				throw new Error(
					`Transition "${transition.id}" references unknown from-state "${from}"`,
				);
			}
		}
		if (!stateIds.has(transition.to)) {
			throw new Error(
				`Transition "${transition.id}" references unknown to-state "${transition.to}"`,
			);
		}
		if (actionIds && !actionIds.has(transition.action)) {
			throw new Error(
				`Transition "${transition.id}" references unknown action "${transition.action}"`,
			);
		}
	}

	function checkComputeRefs(node: unknown, path: string): void {
		if (node === null || node === undefined) return;
		const n = node as Record<string, unknown>;
		if ("compute" in n && typeof n.compute === "string") {
			if (!computationKeys.has(n.compute)) {
				throw new Error(
					`${path} references unknown computation "${n.compute}"`,
				);
			}
		}
		if ("all" in n && Array.isArray(n.all)) {
			for (let i = 0; i < n.all.length; i++) {
				checkComputeRefs(n.all[i], `${path}.all[${i}]`);
			}
		}
		if ("any" in n && Array.isArray(n.any)) {
			for (let i = 0; i < n.any.length; i++) {
				checkComputeRefs(n.any[i], `${path}.any[${i}]`);
			}
		}
		if ("not" in n) {
			checkComputeRefs(n.not, `${path}.not`);
		}
	}

	if (rules.computations) {
		for (const [key, comp] of Object.entries(rules.computations)) {
			checkComputeRefs(comp, `computation.${key}`);
		}
	}
	for (const transition of rules.transitions) {
		if (transition.guard) {
			checkComputeRefs(transition.guard, `transition.${transition.id}.guard`);
		}
	}
}

const cache = new Map<string, Rules>();

const BUNDLED_VERSIONS: Record<string, unknown> = {
	"2027.1": rawV20271,
};

export function loadRules(version: string): Rules {
	const cached = cache.get(version);
	if (cached) return cached;

	const raw = BUNDLED_VERSIONS[version];
	if (!raw) {
		throw new Error(`Unknown rules version: "${version}"`);
	}

	const parsed = RulesSchema.parse(raw);
	runSanityChecks(parsed);
	cache.set(version, parsed);
	return parsed;
}

export function applyAction(
	facts: Facts,
	action: string,
	rules: Rules,
): { nextStatus: string; events: RuleEvent[] } {
	const currentState = facts.currentState as string | undefined;
	const computations = (rules.computations ?? {}) as Record<
		string,
		ComputationNode
	>;
	const thresholds = rules.thresholds;

	for (const transition of rules.transitions) {
		if (transition.action !== action) continue;
		if (currentState && !transition.from.includes(currentState)) continue;

		if (!matchesPayload(transition.matchPayload, facts)) continue;

		if (
			transition.guard &&
			!evaluatePredicate(transition.guard, facts, computations, thresholds)
		) {
			continue;
		}

		return { nextStatus: transition.to, events: transition.events };
	}

	throw new Error(
		`No matching transition for state="${currentState ?? "(none)"}" action="${action}". Facts: ${JSON.stringify(facts)}`,
	);
}

export function _resetCacheForTests(): void {
	cache.clear();
}

import { describe, expect, it } from "vitest";

import { RulesSchema } from "../schema";
import rawV20271 from "../v2027.1.json";

describe("v2027.1.json — structural consistency", () => {
	const rules = RulesSchema.parse(rawV20271);
	const stateIds = new Set(rules.states.map((s) => s.id));
	const stageIds = new Set(rules.stages.map((s) => s.id));
	const computationKeys = rules.computations
		? new Set(Object.keys(rules.computations))
		: new Set<string>();

	it("every transition.to is a known state", () => {
		for (const t of rules.transitions) {
			expect(
				stateIds.has(t.to),
				`transition "${t.id}" has unknown to-state "${t.to}"`,
			).toBe(true);
		}
	});

	it("every transition.from entry is a known state", () => {
		for (const t of rules.transitions) {
			for (const from of t.from) {
				expect(
					stateIds.has(from),
					`transition "${t.id}" has unknown from-state "${from}"`,
				).toBe(true);
			}
		}
	});

	it("every state.stage is null or references a known stage", () => {
		for (const s of rules.states) {
			if (s.stage !== null) {
				expect(
					stageIds.has(s.stage),
					`state "${s.id}" references unknown stage ${s.stage}`,
				).toBe(true);
			}
		}
	});

	it("every compute ref inside guards is a known computation key", () => {
		function collectComputeRefs(node: unknown, path: string): string[] {
			if (node === null || node === undefined) return [];
			const n = node as Record<string, unknown>;
			const refs: string[] = [];
			if ("compute" in n && typeof n.compute === "string") {
				refs.push(n.compute);
			}
			if ("all" in n && Array.isArray(n.all)) {
				for (const child of n.all)
					refs.push(...collectComputeRefs(child, path));
			}
			if ("any" in n && Array.isArray(n.any)) {
				for (const child of n.any)
					refs.push(...collectComputeRefs(child, path));
			}
			if ("not" in n) refs.push(...collectComputeRefs(n.not, `${path}.not`));
			return refs;
		}

		for (const t of rules.transitions) {
			if (t.guard) {
				const refs = collectComputeRefs(t.guard, `transition.${t.id}.guard`);
				for (const ref of refs) {
					expect(
						computationKeys.has(ref),
						`transition "${t.id}" guard references unknown computation "${ref}"`,
					).toBe(true);
				}
			}
		}
	});

	it("every event type emitted by a transition is one of the allowed types", () => {
		const allowedTypes = new Set([
			"submit",
			"path_choice",
			"second_declaration_submit",
			"joint_evaluation_submit",
			"cse_opinion_submit",
			"cancel",
			"demarche_complete",
		]);
		for (const t of rules.transitions) {
			for (const event of t.events) {
				expect(
					allowedTypes.has(event.type),
					`transition "${t.id}" emits unknown event type "${event.type}"`,
				).toBe(true);
			}
		}
	});

	it("every computation node's internal compute refs are known", () => {
		if (!rules.computations) return;

		function collectComputeRefs(node: unknown): string[] {
			if (node === null || node === undefined) return [];
			const n = node as Record<string, unknown>;
			const refs: string[] = [];
			if ("compute" in n && typeof n.compute === "string") {
				refs.push(n.compute);
			}
			if ("all" in n && Array.isArray(n.all)) {
				for (const child of n.all) refs.push(...collectComputeRefs(child));
			}
			if ("any" in n && Array.isArray(n.any)) {
				for (const child of n.any) refs.push(...collectComputeRefs(child));
			}
			if ("not" in n) refs.push(...collectComputeRefs(n.not));
			return refs;
		}

		for (const [key, comp] of Object.entries(rules.computations)) {
			const refs = collectComputeRefs(comp);
			for (const ref of refs) {
				expect(
					computationKeys.has(ref),
					`computation "${key}" references unknown computation "${ref}"`,
				).toBe(true);
			}
		}
	});

	it("all transition IDs are unique", () => {
		const ids = rules.transitions.map((t) => t.id);
		const unique = new Set(ids);
		expect(unique.size).toBe(ids.length);
	});

	it("all state IDs are unique", () => {
		const ids = rules.states.map((s) => s.id);
		const unique = new Set(ids);
		expect(unique.size).toBe(ids.length);
	});

	it("all stage IDs are unique", () => {
		const ids = rules.stages.map((s) => s.id);
		const unique = new Set(ids);
		expect(unique.size).toBe(ids.length);
	});

	it("has at least one terminal state (reachable end)", () => {
		const hasTerminal =
			rules.states.some((s) => s.terminal === true) ||
			(() => {
				const toStates = new Set(rules.transitions.map((t) => t.to));
				// Terminal = reachable and with no transition leaving it for a
				// *different* state. A self-loop (e.g. a re-submittable CSE deposit
				// looping on demarche_completed) does not disqualify it.
				return [...toStates].some(
					(id) =>
						!rules.transitions.some((t) => t.from.includes(id) && t.to !== id),
				);
			})();
		expect(hasTerminal).toBe(true);
	});

	it("every threshold value is a finite positive number", () => {
		for (const [key, val] of Object.entries(rules.thresholds)) {
			expect(
				Number.isFinite(val) && val > 0,
				`threshold "${key}" = ${val} is not a finite positive number`,
			).toBe(true);
		}
	});
});

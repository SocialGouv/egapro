import { describe, expect, it } from "vitest";

import { RulesSchema } from "../schema";
import rawV20271 from "../v2027.1.json";

describe("RulesSchema", () => {
	it("parses v2027.1.json without errors", () => {
		expect(() => RulesSchema.parse(rawV20271)).not.toThrow();
	});

	it("returns a typed object with required top-level fields", () => {
		const rules = RulesSchema.parse(rawV20271);
		expect(rules.version).toBe("2027.1");
		expect(rules.stages.length).toBeGreaterThan(0);
		expect(rules.states.length).toBeGreaterThan(0);
		expect(rules.transitions.length).toBeGreaterThan(0);
		expect(rules.thresholds).toBeDefined();
	});

	it("rejects a JSON missing required fields", () => {
		expect(() => RulesSchema.parse({ version: "bad" })).toThrow();
	});

	it("rejects a JSON with invalid transition structure", () => {
		const bad = {
			...rawV20271,
			transitions: [
				{
					id: "x",
					from: [],
					action: "submit",
					to: "draft",
					writes: [],
				},
			],
		};
		expect(() => RulesSchema.parse(bad)).toThrow();
	});

	it("accepts a state with null stage", () => {
		const rules = RulesSchema.parse(rawV20271);
		const draft = rules.states.find((s) => s.id === "draft");
		expect(draft).toBeDefined();
		expect(draft?.stage).toBeNull();
	});

	it("accepts states with numeric stage references", () => {
		const rules = RulesSchema.parse(rawV20271);
		const nonDraftStates = rules.states.filter((s) => s.stage !== null);
		expect(nonDraftStates.length).toBeGreaterThan(0);
		for (const s of nonDraftStates) {
			expect(typeof s.stage).toBe("number");
		}
	});

	// schema.ts binds the engine JSON to DECLARATION_FSM_STATUSES via z.enum, so an out-of-union state fails the parse.
	it("rejects a state id outside the FSM union", () => {
		const bad = {
			...rawV20271,
			states: [...rawV20271.states, { id: "not_a_real_state", stage: null }],
		};
		expect(() => RulesSchema.parse(bad)).toThrow();
	});

	it("rejects a transition targeting a state outside the FSM union", () => {
		const [first, ...rest] = rawV20271.transitions;
		const bad = {
			...rawV20271,
			transitions: [{ ...first, to: "not_a_real_state" }, ...rest],
		};
		expect(() => RulesSchema.parse(bad)).toThrow();
	});

	it("rejects a transition whose from references a state outside the FSM union", () => {
		const [first, ...rest] = rawV20271.transitions;
		const bad = {
			...rawV20271,
			transitions: [{ ...first, from: ["not_a_real_state"] }, ...rest],
		};
		expect(() => RulesSchema.parse(bad)).toThrow();
	});
});

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
});

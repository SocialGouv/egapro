import { describe, expect, it } from "vitest";

import { compliancePathEnum } from "~/server/db/schema";
import {
	collectCompliancePathsByRound,
	listCompliancePathsByRound,
} from "../compliancePaths";
import { listBundledRulesVersions, loadRules, type Rules } from "../engine";

describe("listCompliancePathsByRound", () => {
	const byRound = listCompliancePathsByRound();

	// Spelled out rather than re-derived: a test that walks the ruleset the same
	// way the function does would agree with any bug it has (#4115).
	it("offers the three paths at the first declaration on v2027.1", () => {
		expect(byRound[1]).toEqual([
			"justify",
			"corrective_action",
			"joint_evaluation",
		]);
	});

	it("drops corrective_action at the second declaration on v2027.1", () => {
		expect(byRound[2]).toEqual(["justify", "joint_evaluation"]);
	});

	it("orders each round along the compliance_path enum", () => {
		for (const round of [1, 2] as const) {
			const positions = byRound[round].map((path) =>
				compliancePathEnum.enumValues.indexOf(path),
			);
			expect(positions).toEqual([...positions].sort((a, b) => a - b));
		}
	});

	it("never invents a value outside the compliance_path enum", () => {
		for (const round of [1, 2] as const) {
			for (const path of byRound[round]) {
				expect(compliancePathEnum.enumValues).toContain(path);
			}
		}
	});

	it("covers every path_choice event of every bundled ruleset", () => {
		for (const version of listBundledRulesVersions()) {
			for (const transition of loadRules(version).transitions) {
				for (const event of transition.events) {
					if (event.type !== "path_choice") continue;
					expect(event.round).toBeDefined();
					expect(event.value).toBeDefined();
					if (event.round === undefined || event.value === undefined) continue;
					expect(byRound[event.round]).toContain(event.value);
				}
			}
		}
	});

	it("reads every bundled ruleset, not only the current one", () => {
		expect(listBundledRulesVersions().length).toBeGreaterThan(0);
	});
});

describe("collectCompliancePathsByRound", () => {
	function rulesetWithEvents(events: Rules["transitions"][number]["events"]) {
		return {
			version: "test",
			thresholds: {},
			stages: [{ id: 1, name: "Étape" }],
			states: [{ id: "draft", stage: null }],
			transitions: [
				{
					id: "t",
					from: ["draft"],
					action: "choose_compliance_path",
					to: "draft",
					events,
				},
			],
		} satisfies Rules;
	}

	it("returns both rounds empty when no ruleset emits a path choice", () => {
		expect(
			collectCompliancePathsByRound([rulesetWithEvents([{ type: "submit" }])]),
		).toEqual({ 1: [], 2: [] });
	});

	it("ignores a path_choice event that names no path or no round", () => {
		expect(
			collectCompliancePathsByRound([
				rulesetWithEvents([
					{ type: "path_choice", round: 1 },
					{ type: "path_choice", value: "justify" },
				]),
			]),
		).toEqual({ 1: [], 2: [] });
	});

	it("ignores a path the compliance_path enum does not know", () => {
		expect(
			collectCompliancePathsByRound([
				rulesetWithEvents([
					{ type: "path_choice", value: "retired_path", round: 1 },
					{ type: "path_choice", value: "justify", round: 1 },
				]),
			]),
		).toEqual({ 1: ["justify"], 2: [] });
	});

	it("unions the rounds across rulesets, so a dropped path survives for older declarations", () => {
		expect(
			collectCompliancePathsByRound([
				rulesetWithEvents([
					{ type: "path_choice", value: "corrective_action", round: 1 },
				]),
				rulesetWithEvents([
					{ type: "path_choice", value: "justify", round: 1 },
				]),
			]),
		).toEqual({ 1: ["justify", "corrective_action"], 2: [] });
	});
});

import { describe, expect, it } from "vitest";

import { listCompliancePathsByRound } from "~/server/rules/compliancePaths";
import {
	compliancePathsForGapJustification,
	gapJustificationFromPath,
} from "../shared/gapJustification";
import {
	COMPLIANCE_PATHS,
	type ComplianceRound,
	GAP_JUSTIFICATIONS,
} from "../types";

const ROUNDS: ComplianceRound[] = [1, 2];

describe("compliancePathsForGapJustification", () => {
	it.each(
		ROUNDS,
	)("sends fully justified gaps to justify at round %s", (round) => {
		expect(compliancePathsForGapJustification("all", round)).toEqual([
			"justify",
		]);
	});

	it.each([
		"partial",
		"none",
	] as const)("offers corrective actions or joint evaluation for %s at round 1", (justification) => {
		expect(compliancePathsForGapJustification(justification, 1)).toEqual([
			"corrective_action",
			"joint_evaluation",
		]);
	});

	it.each([
		"partial",
		"none",
	] as const)("leads %s straight to joint evaluation at round 2", (justification) => {
		expect(compliancePathsForGapJustification(justification, 2)).toEqual([
			"joint_evaluation",
		]);
	});

	it.each(
		ROUNDS,
	)("covers exactly the paths the rule engine offers at round %s", (round) => {
		const offered = new Set(
			GAP_JUSTIFICATIONS.flatMap((justification) =>
				compliancePathsForGapJustification(justification, round),
			),
		);
		expect(COMPLIANCE_PATHS.filter((path) => offered.has(path))).toEqual(
			listCompliancePathsByRound()[round],
		);
	});
});

describe("gapJustificationFromPath", () => {
	it("reads a saved justify path back as all gaps justified", () => {
		expect(gapJustificationFromPath("justify")).toBe("all");
	});

	it.each([
		"corrective_action",
		"joint_evaluation",
		undefined,
	] as const)("cannot tell partial from none for %s", (path) => {
		expect(gapJustificationFromPath(path)).toBeUndefined();
	});
});

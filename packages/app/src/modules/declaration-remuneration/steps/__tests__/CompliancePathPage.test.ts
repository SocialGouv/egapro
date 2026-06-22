import { describe, expect, it } from "vitest";

import { getComplianceState } from "../CompliancePathPage";

const noGapCategory = {
	annualBaseWomen: "30000",
	annualBaseMen: "31000",
};

const highGapCategory = {
	annualBaseWomen: "25000",
	annualBaseMen: "35000",
};

describe("getComplianceState", () => {
	it("returns no_gap when no categories have gaps above threshold", () => {
		const result = getComplianceState(null, false, [noGapCategory], []);
		expect(result).toEqual({ type: "no_gap" });
	});

	it("returns no_gap with empty categories", () => {
		const result = getComplianceState(null, false, [], []);
		expect(result).toEqual({ type: "no_gap" });
	});

	it("returns first_round when gaps exist and no compliance path set", () => {
		const result = getComplianceState(null, false, [highGapCategory], []);
		expect(result).toEqual({ type: "first_round" });
	});

	it("returns first_round when path is corrective_action but second declaration not submitted", () => {
		const result = getComplianceState(
			"corrective_action",
			false,
			[highGapCategory],
			[],
		);
		expect(result).toEqual({ type: "first_round" });
	});

	it("returns first_round when path is corrective_action, submitted, but correction gaps resolved", () => {
		const result = getComplianceState(
			"corrective_action",
			true,
			[highGapCategory],
			[noGapCategory],
		);
		expect(result).toEqual({ type: "first_round" });
	});

	it("returns second_round when corrective_action submitted and correction gaps persist", () => {
		const result = getComplianceState(
			"corrective_action",
			true,
			[highGapCategory],
			[highGapCategory],
		);
		expect(result).toEqual({ type: "second_round" });
	});

	it("returns first_round when path is joint_evaluation regardless of second declaration", () => {
		const result = getComplianceState(
			"joint_evaluation",
			true,
			[highGapCategory],
			[highGapCategory],
		);
		expect(result).toEqual({ type: "first_round" });
	});

	it("returns first_round when path is justify", () => {
		const result = getComplianceState("justify", false, [highGapCategory], []);
		expect(result).toEqual({ type: "first_round" });
	});
});

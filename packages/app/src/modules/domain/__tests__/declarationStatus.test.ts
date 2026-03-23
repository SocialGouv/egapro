import { describe, expect, it } from "vitest";

import { computeDeclarationStatus } from "../shared/declarationStatus";

describe("computeDeclarationStatus", () => {
	it("returns to_complete when declaration is undefined", () => {
		expect(computeDeclarationStatus(undefined)).toBe("to_complete");
	});

	it("returns to_complete for draft with currentStep 0", () => {
		expect(computeDeclarationStatus({ status: "draft", currentStep: 0 })).toBe(
			"to_complete",
		);
	});

	it("returns to_complete for draft with null currentStep", () => {
		expect(
			computeDeclarationStatus({ status: "draft", currentStep: null }),
		).toBe("to_complete");
	});

	it("returns done for submitted declaration", () => {
		expect(
			computeDeclarationStatus({ status: "submitted", currentStep: 6 }),
		).toBe("done");
	});

	it("returns in_progress for draft with currentStep > 0", () => {
		expect(computeDeclarationStatus({ status: "draft", currentStep: 3 })).toBe(
			"in_progress",
		);
	});

	it("returns in_progress for unknown status with currentStep > 0", () => {
		expect(computeDeclarationStatus({ status: "other", currentStep: 1 })).toBe(
			"in_progress",
		);
	});
});

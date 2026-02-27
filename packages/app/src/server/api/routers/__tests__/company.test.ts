import { describe, expect, it } from "vitest";

import { computeDeclarationStatus } from "~/modules/my-space/declarationStatus";

describe("computeDeclarationStatus", () => {
	it("returns to_complete when no declaration exists", () => {
		expect(computeDeclarationStatus(undefined)).toBe("to_complete");
	});

	it("returns to_complete for draft status at step 0", () => {
		expect(computeDeclarationStatus({ status: "draft", currentStep: 0 })).toBe(
			"to_complete",
		);
	});

	it("returns to_complete for draft status with null step", () => {
		expect(
			computeDeclarationStatus({ status: "draft", currentStep: null }),
		).toBe("to_complete");
	});

	it("returns in_progress for draft status at step > 0", () => {
		expect(computeDeclarationStatus({ status: "draft", currentStep: 3 })).toBe(
			"in_progress",
		);
	});

	it("returns done for submitted status", () => {
		expect(
			computeDeclarationStatus({ status: "submitted", currentStep: 6 }),
		).toBe("done");
	});

	it("returns in_progress for any other status", () => {
		expect(computeDeclarationStatus({ status: "review", currentStep: 2 })).toBe(
			"in_progress",
		);
	});
});

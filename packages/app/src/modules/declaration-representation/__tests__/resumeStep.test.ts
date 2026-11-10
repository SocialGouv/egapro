import { describe, expect, it } from "vitest";
import { getRepresentationResumeStep } from "../resumeStep";

describe("getRepresentationResumeStep", () => {
	it("resumes on the furthest step when the draft records no last step", () => {
		expect(
			getRepresentationResumeStep({
				currentStep: 4,
				draft: { currentStep: 4 },
			}),
		).toBe(4);
	});

	it("resumes on the step last worked on when it precedes the furthest one", () => {
		expect(
			getRepresentationResumeStep({
				currentStep: 4,
				draft: { currentStep: 4, lastStep: 2 },
			}),
		).toBe(2);
	});

	it("never resumes beyond the furthest step reached", () => {
		expect(
			getRepresentationResumeStep({
				currentStep: 2,
				draft: { currentStep: 2, lastStep: 4 },
			}),
		).toBe(2);
	});

	it.each([
		null,
		"not a draft",
		{ currentStep: 4, lastStep: 9 },
	])("falls back to the furthest step on an unreadable draft (%j)", (draft) => {
		expect(getRepresentationResumeStep({ currentStep: 3, draft })).toBe(3);
	});

	it("reads a missing progress as step 0", () => {
		expect(
			getRepresentationResumeStep({ currentStep: null, draft: null }),
		).toBe(0);
	});
});

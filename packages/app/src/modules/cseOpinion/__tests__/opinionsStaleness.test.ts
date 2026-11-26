import { describe, expect, it } from "vitest";
import { opinionsSavedBeforeSecondDeclaration } from "../opinionsStaleness";

const SUBMITTED_AT = new Date("2026-03-10T12:00:00Z");

describe("opinionsSavedBeforeSecondDeclaration", () => {
	it("is false without a saved draft", () => {
		expect(
			opinionsSavedBeforeSecondDeclaration({
				draftUpdatedAt: null,
				secondDeclarationSubmittedAt: SUBMITTED_AT,
			}),
		).toBe(false);
	});

	it("is false without a second declaration submission", () => {
		expect(
			opinionsSavedBeforeSecondDeclaration({
				draftUpdatedAt: new Date("2026-03-09T12:00:00Z"),
				secondDeclarationSubmittedAt: null,
			}),
		).toBe(false);
	});

	it("is true when the draft predates the latest submission", () => {
		expect(
			opinionsSavedBeforeSecondDeclaration({
				draftUpdatedAt: new Date("2026-03-09T12:00:00Z"),
				secondDeclarationSubmittedAt: SUBMITTED_AT,
			}),
		).toBe(true);
	});

	it("is false when the draft was saved after the latest submission", () => {
		expect(
			opinionsSavedBeforeSecondDeclaration({
				draftUpdatedAt: new Date("2026-03-11T12:00:00Z"),
				secondDeclarationSubmittedAt: SUBMITTED_AT,
			}),
		).toBe(false);
	});
});

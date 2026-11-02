import { describe, expect, it } from "vitest";
import { getImpersonationCseOpinionEntryHref } from "../impersonationEntry";

describe("getImpersonationCseOpinionEntryHref", () => {
	it("opens the opinions step when no opinion is recorded", () => {
		expect(getImpersonationCseOpinionEntryHref([])).toBe("/avis-cse/etape/1");
	});

	it("opens the upload step once opinions are recorded", () => {
		expect(
			getImpersonationCseOpinionEntryHref([
				{
					declarationNumber: 1,
					type: "accuracy",
					opinion: "favorable",
					opinionDate: "2026-01-15",
					gapConsulted: null,
				},
			]),
		).toBe("/avis-cse/etape/2");
	});
});

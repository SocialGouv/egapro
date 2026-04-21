import { describe, expect, it } from "vitest";

import { campaignDeadlinesFormSchema } from "../schemas";

const validDates = {
	decl1ModificationDeadline: "2026-06-01",
	decl1JustificationDeadline: "2026-06-01",
	decl1JointEvaluationDeadline: "2026-08-01",
	decl2ModificationDeadline: "2026-12-01",
	decl2JustificationDeadline: "2026-12-01",
	decl2JointEvaluationDeadline: "2027-02-01",
};

describe("campaignDeadlinesFormSchema", () => {
	it("accepts a valid payload", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			campaignStartDate: "2026-03-15",
			...validDates,
		});
		expect(result.success).toBe(true);
	});

	it("coerces empty optional dates to null", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			campaignStartDate: "",
			...validDates,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.campaignStartDate).toBeNull();
		}
	});

	it("ignores any extra gipPublicationDate field sent from the client", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			gipPublicationDate: "2026-03-01",
			campaignStartDate: null,
			...validDates,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(
				"gipPublicationDate" in (result.data as Record<string, unknown>),
			).toBe(false);
		}
	});

	it("rejects invalid date formats", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			campaignStartDate: null,
			...validDates,
			decl1ModificationDeadline: "2026/06/01",
		});
		expect(result.success).toBe(false);
	});

	it("rejects years below FIRST_DECLARATION_YEAR", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 1999,
			campaignStartDate: null,
			...validDates,
		});
		expect(result.success).toBe(false);
	});

	it("rejects when decl2 is not after decl1", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			campaignStartDate: null,
			...validDates,
			decl2ModificationDeadline: "2026-05-01",
		});
		expect(result.success).toBe(false);
	});
});

import { describe, expect, it } from "vitest";

import {
	campaignDeadlinesFormSchema,
	getRepresentationCampaignByYearSchema,
	representationCampaignFormSchema,
} from "../schemas";

const validDates = {
	decl1ModificationDeadline: "2026-06-01",
	decl1JustificationDeadline: "2026-06-01",
	decl1JointEvaluationDeadline: "2026-08-01",
	decl2ModificationDeadline: "2026-12-01",
	decl2JustificationDeadline: "2026-12-01",
	decl2JointEvaluationDeadline: "2027-01-01",
	decl2CseOpinionDeadline: "2027-02-01",
};

describe("campaignDeadlinesFormSchema", () => {
	it("accepts a valid payload", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			campaignStartDate: "2026-03-15",
			publicDataReleaseDate: "2026-06-15",
			...validDates,
		});
		expect(result.success).toBe(true);
	});

	it("coerces empty optional dates to null", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			campaignStartDate: "",
			publicDataReleaseDate: "",
			...validDates,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.campaignStartDate).toBeNull();
			expect(result.data.publicDataReleaseDate).toBeNull();
		}
	});

	it("ignores any extra gipPublicationDate field sent from the client", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			gipPublicationDate: "2026-03-01",
			campaignStartDate: null,
			publicDataReleaseDate: null,
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
			publicDataReleaseDate: null,
			...validDates,
			decl1ModificationDeadline: "2026/06/01",
		});
		expect(result.success).toBe(false);
	});

	it("rejects an invalid publicDataReleaseDate format", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			campaignStartDate: null,
			publicDataReleaseDate: "2026/06/15",
			...validDates,
		});
		expect(result.success).toBe(false);
	});

	it("rejects years below FIRST_DECLARATION_YEAR", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 1999,
			campaignStartDate: null,
			publicDataReleaseDate: null,
			...validDates,
		});
		expect(result.success).toBe(false);
	});

	it("requires decl2CseOpinionDeadline", () => {
		const { decl2CseOpinionDeadline, ...withoutCseOpinion } = validDates;
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			campaignStartDate: null,
			publicDataReleaseDate: null,
			...withoutCseOpinion,
		});
		expect(result.success).toBe(false);
	});

	it("rejects an invalid decl2CseOpinionDeadline format", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			campaignStartDate: null,
			publicDataReleaseDate: null,
			...validDates,
			decl2CseOpinionDeadline: "2027/02/01",
		});
		expect(result.success).toBe(false);
	});

	it("keeps decl2CseOpinionDeadline distinct from decl2JointEvaluationDeadline", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			campaignStartDate: null,
			publicDataReleaseDate: null,
			...validDates,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.decl2JointEvaluationDeadline).toBe("2027-01-01");
			expect(result.data.decl2CseOpinionDeadline).toBe("2027-02-01");
		}
	});

	it("rejects when decl2 is not after decl1", () => {
		const result = campaignDeadlinesFormSchema.safeParse({
			year: 2026,
			campaignStartDate: null,
			publicDataReleaseDate: null,
			...validDates,
			decl2ModificationDeadline: "2026-05-01",
		});
		expect(result.success).toBe(false);
	});
});

const validRepresentationCampaign = {
	year: 2026,
	campaignStartDate: "2026-02-01",
	campaignEndDate: "2026-11-30",
	declarationDeadline: "2026-04-15",
};

describe("representationCampaignFormSchema", () => {
	it("accepts a valid payload", () => {
		const result = representationCampaignFormSchema.safeParse(
			validRepresentationCampaign,
		);
		expect(result.success).toBe(true);
	});

	it.each([
		"campaignStartDate",
		"campaignEndDate",
		"declarationDeadline",
	] as const)("requires %s", (field) => {
		const result = representationCampaignFormSchema.safeParse({
			...validRepresentationCampaign,
			[field]: "",
		});
		expect(result.success).toBe(false);
	});

	it.each([
		"campaignStartDate",
		"campaignEndDate",
		"declarationDeadline",
	] as const)("rejects a non ISO %s", (field) => {
		const result = representationCampaignFormSchema.safeParse({
			...validRepresentationCampaign,
			[field]: "01/02/2026",
		});
		expect(result.success).toBe(false);
	});

	it("rejects an end date before the start date, flagged on campaignEndDate", () => {
		const result = representationCampaignFormSchema.safeParse({
			...validRepresentationCampaign,
			campaignEndDate: "2026-01-15",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const issue = result.error.issues[0];
			expect(issue?.path).toEqual(["campaignEndDate"]);
			expect(issue?.message).toBe(
				"La date de démarrage de la campagne doit être antérieure à la date de clôture.",
			);
		}
	});

	it("rejects an end date equal to the start date", () => {
		const result = representationCampaignFormSchema.safeParse({
			...validRepresentationCampaign,
			campaignEndDate: validRepresentationCampaign.campaignStartDate,
		});
		expect(result.success).toBe(false);
	});

	it("accepts a declaration deadline outside the campaign window", () => {
		const result = representationCampaignFormSchema.safeParse({
			...validRepresentationCampaign,
			declarationDeadline: "2027-01-31",
		});
		expect(result.success).toBe(true);
	});

	it("rejects years below FIRST_DECLARATION_YEAR", () => {
		const result = representationCampaignFormSchema.safeParse({
			...validRepresentationCampaign,
			year: 1999,
		});
		expect(result.success).toBe(false);
	});

	it("rejects years above 2100", () => {
		const result = representationCampaignFormSchema.safeParse({
			...validRepresentationCampaign,
			year: 2101,
		});
		expect(result.success).toBe(false);
	});
});

describe("getRepresentationCampaignByYearSchema", () => {
	it("accepts a supported year", () => {
		expect(
			getRepresentationCampaignByYearSchema.safeParse({ year: 2026 }).success,
		).toBe(true);
	});

	it("rejects a non-integer year", () => {
		expect(
			getRepresentationCampaignByYearSchema.safeParse({ year: 2026.5 }).success,
		).toBe(false);
	});
});

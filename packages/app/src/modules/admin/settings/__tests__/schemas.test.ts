import { describe, expect, it } from "vitest";

import {
	commonCalendarFormSchema,
	getCommonCalendarPreconditionMessage,
	getRepresentationCampaignByYearSchema,
	remunerationDeadlinesFormSchema,
	representationCampaignFormSchema,
} from "../schemas";

const validDates = {
	decl1ModificationDeadline: "2026-06-01",
	decl1JointEvaluationDeadline: "2026-08-01",
	decl2ModificationDeadline: "2026-12-01",
	decl2JointEvaluationDeadline: "2027-01-01",
	decl2CseOpinionDeadline: "2027-02-01",
};

describe("remunerationDeadlinesFormSchema", () => {
	it("accepts a valid payload", () => {
		const result = remunerationDeadlinesFormSchema.safeParse({
			year: 2026,
			...validDates,
		});
		expect(result.success).toBe(true);
	});

	it("ignores the common calendar and GIP fields sent from the client", () => {
		const result = remunerationDeadlinesFormSchema.safeParse({
			year: 2026,
			gipPublicationDate: "2026-03-01",
			campaignStartDate: "2026-03-15",
			publicDataReleaseDate: "2026-06-15",
			...validDates,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			const data = result.data as Record<string, unknown>;
			expect("gipPublicationDate" in data).toBe(false);
			expect("campaignStartDate" in data).toBe(false);
			expect("publicDataReleaseDate" in data).toBe(false);
		}
	});

	it("ignores the justification deadlines sent from the client", () => {
		const result = remunerationDeadlinesFormSchema.safeParse({
			year: 2026,
			decl1JustificationDeadline: "2026-06-01",
			decl2JustificationDeadline: "2026-12-01",
			...validDates,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			const data = result.data as Record<string, unknown>;
			expect("decl1JustificationDeadline" in data).toBe(false);
			expect("decl2JustificationDeadline" in data).toBe(false);
		}
	});

	it("ignores the derived path choice deadlines sent from the client", () => {
		const result = remunerationDeadlinesFormSchema.safeParse({
			year: 2026,
			pathChoiceRound1Deadline: "2026-07-01",
			pathChoiceDeadline: "2027-01-01",
			...validDates,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			const data = result.data as Record<string, unknown>;
			expect("pathChoiceRound1Deadline" in data).toBe(false);
			expect("pathChoiceDeadline" in data).toBe(false);
		}
	});

	it("rejects a decl2 modification deadline not after the decl1 one with the échéance message", () => {
		const result = remunerationDeadlinesFormSchema.safeParse({
			year: 2026,
			...validDates,
			decl2ModificationDeadline: "2026-05-01",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe(
				"L'échéance de la seconde déclaration (actions correctives) doit être postérieure à l'échéance de déclaration.",
			);
			expect(result.error.issues[0]?.path).toEqual([
				"decl2ModificationDeadline",
			]);
		}
	});

	it("rejects invalid date formats", () => {
		const result = remunerationDeadlinesFormSchema.safeParse({
			year: 2026,
			...validDates,
			decl1ModificationDeadline: "2026/06/01",
		});
		expect(result.success).toBe(false);
	});

	it("rejects years below FIRST_DECLARATION_YEAR", () => {
		const result = remunerationDeadlinesFormSchema.safeParse({
			year: 1999,
			...validDates,
		});
		expect(result.success).toBe(false);
	});

	it("requires decl2CseOpinionDeadline", () => {
		const { decl2CseOpinionDeadline, ...withoutCseOpinion } = validDates;
		const result = remunerationDeadlinesFormSchema.safeParse({
			year: 2026,
			...withoutCseOpinion,
		});
		expect(result.success).toBe(false);
	});

	it("rejects an invalid decl2CseOpinionDeadline format", () => {
		const result = remunerationDeadlinesFormSchema.safeParse({
			year: 2026,
			...validDates,
			decl2CseOpinionDeadline: "2027/02/01",
		});
		expect(result.success).toBe(false);
	});

	it("keeps decl2CseOpinionDeadline distinct from decl2JointEvaluationDeadline", () => {
		const result = remunerationDeadlinesFormSchema.safeParse({
			year: 2026,
			...validDates,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.decl2JointEvaluationDeadline).toBe("2027-01-01");
			expect(result.data.decl2CseOpinionDeadline).toBe("2027-02-01");
		}
	});

	it("rejects when decl2 is not after decl1", () => {
		const result = remunerationDeadlinesFormSchema.safeParse({
			year: 2026,
			...validDates,
			decl2ModificationDeadline: "2026-05-01",
		});
		expect(result.success).toBe(false);
	});
});

describe("commonCalendarFormSchema", () => {
	it("accepts a valid payload", () => {
		const result = commonCalendarFormSchema.safeParse({
			year: 2026,
			campaignStartDate: "2026-03-15",
			publicDataReleaseDate: "2026-06-15",
		});
		expect(result.success).toBe(true);
	});

	it("coerces an empty publicDataReleaseDate to null", () => {
		const result = commonCalendarFormSchema.safeParse({
			year: 2026,
			campaignStartDate: "2026-03-15",
			publicDataReleaseDate: "",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.campaignStartDate).toBe("2026-03-15");
			expect(result.data.publicDataReleaseDate).toBeNull();
		}
	});

	it.each([
		["an empty", ""],
		["a null", null],
	])("rejects %s campaignStartDate", (_label, campaignStartDate) => {
		const result = commonCalendarFormSchema.safeParse({
			year: 2026,
			campaignStartDate,
			publicDataReleaseDate: null,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.path).toEqual(["campaignStartDate"]);
		}
	});

	it("rejects a missing campaignStartDate", () => {
		const result = commonCalendarFormSchema.safeParse({
			year: 2026,
			publicDataReleaseDate: null,
		});
		expect(result.success).toBe(false);
	});

	it("ignores the remuneration deadlines and the GIP date sent from the client", () => {
		const result = commonCalendarFormSchema.safeParse({
			year: 2026,
			gipPublicationDate: "2026-03-01",
			campaignStartDate: "2026-03-15",
			publicDataReleaseDate: null,
			...validDates,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(Object.keys(result.data).sort()).toEqual([
				"campaignStartDate",
				"publicDataReleaseDate",
				"year",
			]);
		}
	});

	it("rejects an invalid publicDataReleaseDate format", () => {
		const result = commonCalendarFormSchema.safeParse({
			year: 2026,
			campaignStartDate: "2026-03-15",
			publicDataReleaseDate: "2026/06/15",
		});
		expect(result.success).toBe(false);
	});

	it("rejects an invalid campaignStartDate format", () => {
		const result = commonCalendarFormSchema.safeParse({
			year: 2026,
			campaignStartDate: "15/03/2026",
			publicDataReleaseDate: null,
		});
		expect(result.success).toBe(false);
	});

	it("rejects years below FIRST_DECLARATION_YEAR", () => {
		const result = commonCalendarFormSchema.safeParse({
			year: 1999,
			campaignStartDate: "2026-03-15",
			publicDataReleaseDate: null,
		});
		expect(result.success).toBe(false);
	});
});

describe("getCommonCalendarPreconditionMessage", () => {
	it("invites the admin to save the remuneration deadlines of the year first", () => {
		expect(getCommonCalendarPreconditionMessage(2027)).toBe(
			"Enregistrez d'abord les échéances de la démarche Rémunération pour 2027.",
		);
	});
});

const validRepresentationCampaign = {
	year: 2026,
	declarationDeadline: "2026-04-15",
};

describe("representationCampaignFormSchema", () => {
	it("accepts a valid payload", () => {
		const result = representationCampaignFormSchema.safeParse(
			validRepresentationCampaign,
		);
		expect(result.success).toBe(true);
	});

	it("requires declarationDeadline", () => {
		const result = representationCampaignFormSchema.safeParse({
			...validRepresentationCampaign,
			declarationDeadline: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a non ISO declarationDeadline", () => {
		const result = representationCampaignFormSchema.safeParse({
			...validRepresentationCampaign,
			declarationDeadline: "01/02/2026",
		});
		expect(result.success).toBe(false);
	});

	it("ignores the campaign start and end dates sent from the client", () => {
		const result = representationCampaignFormSchema.safeParse({
			...validRepresentationCampaign,
			campaignStartDate: "2026-11-30",
			campaignEndDate: "2026-02-01",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(Object.keys(result.data).sort()).toEqual([
				"declarationDeadline",
				"year",
			]);
		}
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

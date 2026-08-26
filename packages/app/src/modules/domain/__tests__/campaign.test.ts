import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	getCurrentYear,
	getDeclarationDeadline,
	getDeclarationReferencePeriod,
	getDefaultCampaignDeadlines,
	getDefaultRepresentationCampaign,
	getPathChoiceDeadline,
	getPathChoiceRound1Deadline,
	getReferencePeriod,
	getReferenceYearFor,
	getRepresentationDeadline,
	getSecondDeclarationDeadline,
	getWorkforceYear,
	isDeadlinePassed,
	isRepresentationCampaignOpen,
	selectJointEvaluationDeadline,
	selectPathChoiceDeadline,
	shouldRedirectSubmittedToRecap,
} from "../shared/campaign";

describe("getReferenceYearFor", () => {
	it("returns the campaign year minus one", () => {
		expect(getReferenceYearFor(2025)).toBe(2024);
	});
});

describe("getRepresentationDeadline", () => {
	it("returns March 1st of the given year", () => {
		expect(getRepresentationDeadline(2025)).toBe("01/03/2025");
	});
});

describe("getReferencePeriod", () => {
	it("returns the civil year preceding the campaign (N-1)", () => {
		expect(getReferencePeriod(2026)).toBe("01/01/2025 - 31/12/2025");
		expect(getReferencePeriod(2025)).toBe("01/01/2024 - 31/12/2024");
	});

	it("uses the workforce year of the campaign as the reference window", () => {
		expect(getReferencePeriod(2027)).toBe(
			`01/01/${getReferenceYearFor(2027)} - 31/12/${getReferenceYearFor(2027)}`,
		);
	});
});

describe("getDeclarationReferencePeriod", () => {
	const CAMPAIGN_YEAR = 2026;
	const CIVIL_PERIOD = "01/01/2025 - 31/12/2025";
	// Deliberately off the civil year: the assertion only discriminates if the
	// persisted window cannot be produced by getReferencePeriod.
	const CAPTURED_START = "2025-07-01";
	const CAPTURED_END = "2026-06-30";

	it("returns the period captured at step 2 of a second declaration", () => {
		expect(
			getDeclarationReferencePeriod(
				CAMPAIGN_YEAR,
				true,
				CAPTURED_START,
				CAPTURED_END,
			),
		).toBe("01/07/2025 - 30/06/2026");
	});

	it("never reads the persisted period for an initial declaration", () => {
		expect(
			getDeclarationReferencePeriod(
				CAMPAIGN_YEAR,
				false,
				CAPTURED_START,
				CAPTURED_END,
			),
		).toBe(CIVIL_PERIOD);
	});

	it("falls back to the civil period for a second declaration predating mandatory capture", () => {
		expect(getDeclarationReferencePeriod(CAMPAIGN_YEAR, true, null, null)).toBe(
			CIVIL_PERIOD,
		);
	});

	it("falls back to the civil period when a single bound is persisted", () => {
		expect(
			getDeclarationReferencePeriod(CAMPAIGN_YEAR, true, CAPTURED_START, null),
		).toBe(CIVIL_PERIOD);
		expect(
			getDeclarationReferencePeriod(CAMPAIGN_YEAR, true, null, CAPTURED_END),
		).toBe(CIVIL_PERIOD);
	});

	it("falls back to the civil period on blank persisted bounds", () => {
		expect(getDeclarationReferencePeriod(CAMPAIGN_YEAR, true, "", "")).toBe(
			CIVIL_PERIOD,
		);
	});

	it("falls back to the civil period on undefined persisted bounds", () => {
		expect(
			getDeclarationReferencePeriod(CAMPAIGN_YEAR, true, undefined, undefined),
		).toBe(CIVIL_PERIOD);
	});

	it("tracks the campaign year of the declaration when falling back", () => {
		expect(getDeclarationReferencePeriod(2027, true, null, null)).toBe(
			getReferencePeriod(2027),
		);
	});
});

describe("getCurrentYear", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		// Never leak the override: every other domain test calls getCurrentYear().
		delete (globalThis as { __egaproCampaignYear?: number })
			.__egaproCampaignYear;
	});

	it("returns the current calendar year", () => {
		vi.setSystemTime(new Date("2025-06-15"));
		expect(getCurrentYear()).toBe(2025);
	});

	it("returns the year from the system clock", () => {
		vi.setSystemTime(new Date("2030-01-01"));
		expect(getCurrentYear()).toBe(2030);
	});

	it("honours a numeric globalThis.__egaproCampaignYear override", () => {
		vi.setSystemTime(new Date("2025-06-15"));
		(globalThis as { __egaproCampaignYear?: number }).__egaproCampaignYear =
			2042;
		expect(getCurrentYear()).toBe(2042);
	});

	it("ignores a non-numeric override and falls back to the system clock", () => {
		vi.setSystemTime(new Date("2025-06-15"));
		(globalThis as { __egaproCampaignYear?: unknown }).__egaproCampaignYear =
			"2042";
		expect(getCurrentYear()).toBe(2025);
	});

	it("falls back to the system clock once the override is cleared", () => {
		vi.setSystemTime(new Date("2025-06-15"));
		(globalThis as { __egaproCampaignYear?: number }).__egaproCampaignYear =
			2042;
		delete (globalThis as { __egaproCampaignYear?: number })
			.__egaproCampaignYear;
		expect(getCurrentYear()).toBe(2025);
	});
});

describe("getWorkforceYear", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns current year - 1", () => {
		vi.setSystemTime(new Date("2025-06-15"));
		expect(getWorkforceYear()).toBe(2024);
	});
});

describe("getDeclarationDeadline", () => {
	it("returns 1er juin for the given year", () => {
		expect(getDeclarationDeadline(2027)).toBe("1ᵉʳ juin 2027");
	});
});

describe("getSecondDeclarationDeadline", () => {
	it("returns 1ᵉʳ décembre for the given year", () => {
		expect(getSecondDeclarationDeadline(2027)).toBe("1ᵉʳ décembre 2027");
	});
});

describe("getPathChoiceDeadline", () => {
	it("returns January 1st of the following year", () => {
		expect(getPathChoiceDeadline(2027)).toEqual(new Date(2027 + 1, 0, 1));
	});

	it("rolls over the year boundary", () => {
		expect(getPathChoiceDeadline(2026)).toEqual(new Date(2027, 0, 1));
	});
});

describe("getPathChoiceRound1Deadline", () => {
	it("returns July 1st of the campaign year", () => {
		expect(getPathChoiceRound1Deadline(2026)).toEqual(new Date(2026, 6, 1));
	});

	it("stays within the campaign year, unlike the round-2 deadline", () => {
		const year = 2027;
		expect(getPathChoiceRound1Deadline(year)).toEqual(new Date(year, 6, 1));
		expect(getPathChoiceRound1Deadline(year)).not.toEqual(
			getPathChoiceDeadline(year),
		);
	});
});

describe("selectPathChoiceDeadline", () => {
	const ROUND_1_DEADLINE = new Date("2027-05-15T00:00:00");
	const ROUND_2_DEADLINE = new Date("2027-11-20T00:00:00");
	// Values that differ from the derived defaults prove the selector reads the given deadlines instead of recomputing them.
	const deadlines = {
		...getDefaultCampaignDeadlines(2027),
		pathChoiceRound1Deadline: ROUND_1_DEADLINE,
		pathChoiceDeadline: ROUND_2_DEADLINE,
	};

	it("returns the round-1 deadline when the company is not in the second round", () => {
		expect(selectPathChoiceDeadline(deadlines, false)).toBe(ROUND_1_DEADLINE);
	});

	it("returns the round-2 deadline when the company is in the second round", () => {
		expect(selectPathChoiceDeadline(deadlines, true)).toBe(ROUND_2_DEADLINE);
	});
});

describe("selectJointEvaluationDeadline", () => {
	const ROUND_1_DEADLINE = new Date("2027-08-15T00:00:00");
	const ROUND_2_DEADLINE = new Date("2028-03-20T00:00:00");
	const deadlines = {
		...getDefaultCampaignDeadlines(2027),
		decl1JointEvaluationDeadline: ROUND_1_DEADLINE,
		decl2JointEvaluationDeadline: ROUND_2_DEADLINE,
	};

	it("returns the round-1 deadline when the company is not in the second round", () => {
		expect(selectJointEvaluationDeadline(deadlines, false)).toBe(
			ROUND_1_DEADLINE,
		);
	});

	it("returns the round-2 deadline when the company is in the second round", () => {
		expect(selectJointEvaluationDeadline(deadlines, true)).toBe(
			ROUND_2_DEADLINE,
		);
	});

	it("never returns the CSE opinion deadline, which closes a later step", () => {
		const defaults = getDefaultCampaignDeadlines(2027);
		expect(selectJointEvaluationDeadline(defaults, true)).not.toEqual(
			defaults.decl2CseOpinionDeadline,
		);
		expect(selectJointEvaluationDeadline(defaults, false)).not.toEqual(
			defaults.decl2CseOpinionDeadline,
		);
	});
});

describe("getDefaultCampaignDeadlines", () => {
	it("returns Date objects for a given year", () => {
		const deadlines = getDefaultCampaignDeadlines(2027);
		expect(deadlines.decl1ModificationDeadline).toEqual(new Date(2027, 5, 1));
		expect(deadlines.decl1JustificationDeadline).toEqual(new Date(2028, 2, 1));
		expect(deadlines.decl1JointEvaluationDeadline).toEqual(
			new Date(2027, 7, 1),
		);
		expect(deadlines.decl2ModificationDeadline).toEqual(new Date(2027, 11, 1));
		expect(deadlines.decl2JustificationDeadline).toEqual(new Date(2027, 11, 1));
		expect(deadlines.decl2JointEvaluationDeadline).toEqual(
			new Date(2028, 0, 1),
		);
		expect(deadlines.decl2CseOpinionDeadline).toEqual(new Date(2028, 1, 1));
	});

	it("keeps the round-2 joint evaluation and CSE opinion deadlines one month apart", () => {
		const deadlines = getDefaultCampaignDeadlines(2027);
		expect(deadlines.decl2JointEvaluationDeadline).not.toEqual(
			deadlines.decl2CseOpinionDeadline,
		);
		expect(deadlines.decl2JointEvaluationDeadline.getTime()).toBeLessThan(
			deadlines.decl2CseOpinionDeadline.getTime(),
		);
	});

	it("exposes the derived path choice deadline at January 1st of year + 1", () => {
		const deadlines = getDefaultCampaignDeadlines(2027);
		expect(deadlines.pathChoiceDeadline).toEqual(getPathChoiceDeadline(2027));
		expect(deadlines.pathChoiceDeadline).toEqual(new Date(2028, 0, 1));
	});

	it("leaves optional campaign dates null by default", () => {
		const deadlines = getDefaultCampaignDeadlines(2027);
		expect(deadlines.gipPublicationDate).toBeNull();
		expect(deadlines.campaignStartDate).toBeNull();
	});
});

describe("getDefaultRepresentationCampaign", () => {
	it("opens on January 1st and closes on December 31st of the campaign year", () => {
		const campaign = getDefaultRepresentationCampaign(2027);
		expect(campaign.campaignStartDate).toEqual(new Date(2027, 0, 1));
		expect(campaign.campaignEndDate).toEqual(new Date(2027, 11, 31));
	});

	it("sets the declaration deadline on March 1st of the campaign year", () => {
		expect(getDefaultRepresentationCampaign(2027).declarationDeadline).toEqual(
			new Date(2027, 2, 1),
		);
	});

	it("follows the requested campaign year", () => {
		const campaign = getDefaultRepresentationCampaign(2030);
		expect(campaign.campaignStartDate).toEqual(new Date(2030, 0, 1));
		expect(campaign.campaignEndDate).toEqual(new Date(2030, 11, 31));
		expect(campaign.declarationDeadline).toEqual(new Date(2030, 2, 1));
	});
});

describe("isRepresentationCampaignOpen", () => {
	const campaign = getDefaultRepresentationCampaign(2027);

	it("returns false the day before the campaign starts", () => {
		expect(isRepresentationCampaignOpen(campaign, new Date(2026, 11, 31))).toBe(
			false,
		);
	});

	it("returns true on the first day of the campaign", () => {
		expect(isRepresentationCampaignOpen(campaign, new Date(2027, 0, 1))).toBe(
			true,
		);
	});

	it("returns true in the middle of the campaign", () => {
		expect(isRepresentationCampaignOpen(campaign, new Date(2027, 5, 15))).toBe(
			true,
		);
	});

	it("returns true on the campaign end boundary", () => {
		expect(isRepresentationCampaignOpen(campaign, new Date(2027, 11, 31))).toBe(
			true,
		);
	});

	it("returns false the day after the campaign ends", () => {
		expect(isRepresentationCampaignOpen(campaign, new Date(2028, 0, 1))).toBe(
			false,
		);
	});

	it("honours the campaign dates over the default ones", () => {
		const overridden = {
			campaignStartDate: new Date(2027, 2, 1),
			campaignEndDate: new Date(2027, 5, 30),
			declarationDeadline: new Date(2027, 2, 1),
		};
		expect(
			isRepresentationCampaignOpen(overridden, new Date(2027, 0, 15)),
		).toBe(false);
		expect(
			isRepresentationCampaignOpen(overridden, new Date(2027, 3, 15)),
		).toBe(true);
	});
});

describe("isDeadlinePassed", () => {
	const deadline = new Date("2026-06-01T00:00:00");

	it("returns false when now is before the deadline", () => {
		expect(isDeadlinePassed(deadline, new Date("2026-05-31T23:59:59"))).toBe(
			false,
		);
	});

	it("returns false when now equals the deadline", () => {
		expect(isDeadlinePassed(deadline, new Date("2026-06-01T00:00:00"))).toBe(
			false,
		);
	});

	it("returns true when now is after the deadline", () => {
		expect(isDeadlinePassed(deadline, new Date("2026-06-01T00:00:01"))).toBe(
			true,
		);
	});
});

describe("shouldRedirectSubmittedToRecap", () => {
	const past = new Date("2020-06-01T00:00:00");
	const future = new Date("2099-06-01T00:00:00");
	const now = new Date("2026-04-07T12:00:00");

	it("returns false when status is not submitted", () => {
		expect(
			shouldRedirectSubmittedToRecap({
				status: "draft",
				step: 2,
				recapStep: 6,
				modificationDeadline: past,
				now,
			}),
		).toBe(false);
	});

	it("returns false when status is null", () => {
		expect(
			shouldRedirectSubmittedToRecap({
				status: null,
				step: 2,
				recapStep: 6,
				modificationDeadline: past,
				now,
			}),
		).toBe(false);
	});

	it("returns false when already on the recap step", () => {
		expect(
			shouldRedirectSubmittedToRecap({
				status: "submitted",
				step: 6,
				recapStep: 6,
				modificationDeadline: past,
				now,
			}),
		).toBe(false);
	});

	it("returns false when the deadline is in the future", () => {
		expect(
			shouldRedirectSubmittedToRecap({
				status: "submitted",
				step: 2,
				recapStep: 6,
				modificationDeadline: future,
				now,
			}),
		).toBe(false);
	});

	it("returns true when submitted, off-recap, and deadline is past", () => {
		expect(
			shouldRedirectSubmittedToRecap({
				status: "submitted",
				step: 2,
				recapStep: 6,
				modificationDeadline: past,
				now,
			}),
		).toBe(true);
	});
});

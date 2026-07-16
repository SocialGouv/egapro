import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	formatIsoDateToFrench,
	getCurrentYear,
	getDeclarationDeadline,
	getDefaultCampaignDeadlines,
	getPathChoiceDeadline,
	getReferencePeriod,
	getRepresentationDeadline,
	getSecondDeclarationDeadline,
	getWorkforceYear,
	getWorkforceYearFor,
	isDeadlinePassed,
	resolveGipReferencePeriod,
	shouldRedirectSubmittedToRecap,
} from "../shared/campaign";

describe("getWorkforceYearFor", () => {
	it("returns the campaign year minus one", () => {
		expect(getWorkforceYearFor(2025)).toBe(2024);
	});
});

describe("getRepresentationDeadline", () => {
	it("returns March 1st of the given year", () => {
		expect(getRepresentationDeadline(2025)).toBe("01/03/2025");
	});
});

describe("getReferencePeriod", () => {
	it("returns the full civil year window", () => {
		expect(getReferencePeriod(2025)).toBe("01/01/2025 - 31/12/2025");
	});
});

describe("formatIsoDateToFrench", () => {
	it("formats an ISO date as DD/MM/YYYY", () => {
		expect(formatIsoDateToFrench("2026-01-01")).toBe("01/01/2026");
		expect(formatIsoDateToFrench("2026-12-31")).toBe("31/12/2026");
	});

	it("returns the input unchanged when not a 3-part ISO date", () => {
		expect(formatIsoDateToFrench("2026")).toBe("2026");
		expect(formatIsoDateToFrench("")).toBe("");
	});
});

describe("resolveGipReferencePeriod", () => {
	it("uses the GIP collection window when both bounds are present", () => {
		expect(resolveGipReferencePeriod("2026-01-01", "2026-12-31", 2026)).toBe(
			"01/01/2026 - 31/12/2026",
		);
		expect(resolveGipReferencePeriod("2025-04-01", "2026-03-31", 2026)).toBe(
			"01/04/2025 - 31/03/2026",
		);
	});

	it("falls back to the full civil year when a bound is missing", () => {
		expect(resolveGipReferencePeriod(null, "2026-12-31", 2026)).toBe(
			"01/01/2026 - 31/12/2026",
		);
		expect(resolveGipReferencePeriod(undefined, "2026-12-31", 2026)).toBe(
			"01/01/2026 - 31/12/2026",
		);
		expect(resolveGipReferencePeriod("2026-01-01", null, 2026)).toBe(
			"01/01/2026 - 31/12/2026",
		);
	});
});

describe("getCurrentYear", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the current calendar year", () => {
		vi.setSystemTime(new Date("2025-06-15"));
		expect(getCurrentYear()).toBe(2025);
	});

	it("returns the year from the system clock", () => {
		vi.setSystemTime(new Date("2030-01-01"));
		expect(getCurrentYear()).toBe(2030);
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
		expect(getDeclarationDeadline(2027)).toBe("1\u1D49\u02B3 juin 2027");
	});
});

describe("getSecondDeclarationDeadline", () => {
	it("returns 1 décembre for the given year", () => {
		expect(getSecondDeclarationDeadline(2027)).toBe("1 décembre 2027");
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

describe("getDefaultCampaignDeadlines", () => {
	it("returns Date objects for a given year", () => {
		const deadlines = getDefaultCampaignDeadlines(2027);
		expect(deadlines.decl1ModificationDeadline).toEqual(new Date(2027, 5, 1));
		expect(deadlines.decl1JustificationDeadline).toEqual(new Date(2027, 5, 1));
		expect(deadlines.decl1JointEvaluationDeadline).toEqual(
			new Date(2027, 7, 1),
		);
		expect(deadlines.decl2ModificationDeadline).toEqual(new Date(2027, 11, 1));
		expect(deadlines.decl2JustificationDeadline).toEqual(new Date(2027, 11, 1));
		expect(deadlines.decl2JointEvaluationDeadline).toEqual(
			new Date(2028, 1, 1),
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

import { describe, expect, it } from "vitest";

import { COMPANY_SIZE_VOLUNTARY_MAX } from "../shared/constants";
import {
	floorWorkforce,
	formatWorkforceForUser,
	GIP_WORKFORCE_VOLUNTARY_DISPLAY,
	getObligationWorkforce,
	parseGipWorkforce,
} from "../shared/gipWorkforce";

describe("parseGipWorkforce", () => {
	it("parses the numeric(9,2) string returned by the postgres driver", () => {
		expect(parseGipWorkforce("70.00")).toBe(70);
		expect(parseGipWorkforce("99.97")).toBe(99.97);
		expect(parseGipWorkforce("0.00")).toBe(0);
	});

	it("passes a number through unchanged", () => {
		expect(parseGipWorkforce(250)).toBe(250);
		expect(parseGipWorkforce(99.97)).toBe(99.97);
		expect(parseGipWorkforce(0)).toBe(0);
	});

	it("returns null when the company is absent from the GIP file", () => {
		expect(parseGipWorkforce(null)).toBeNull();
		expect(parseGipWorkforce(undefined)).toBeNull();
	});

	it("returns null for a non-numeric value", () => {
		expect(parseGipWorkforce("")).toBeNull();
		expect(parseGipWorkforce("n/a")).toBeNull();
		expect(parseGipWorkforce(Number.NaN)).toBeNull();
		expect(parseGipWorkforce(Number.POSITIVE_INFINITY)).toBeNull();
	});

	it("keeps a negative value rather than silently coercing it", () => {
		expect(parseGipWorkforce("-1.00")).toBe(-1);
	});
});

describe("getObligationWorkforce", () => {
	it("returns the exact GIP value when the company is known", () => {
		expect(getObligationWorkforce(70)).toBe(70);
		expect(getObligationWorkforce(99.97)).toBe(99.97);
		expect(getObligationWorkforce(0)).toBe(0);
	});

	it("treats a company absent from the GIP file as a sub-50 headcount", () => {
		expect(getObligationWorkforce(null)).toBe(0);
	});

	// Downstream obligation consequences (absent company → no obligation;
	// exact-value comparison for decimal workforces like 99.97) live in the
	// GIP-workforce describes of demarcheDecisionTable.test.ts (#3975).
});

describe("GIP_WORKFORCE_VOLUNTARY_DISPLAY", () => {
	it("is the label shown instead of any Weez/INSEE fallback value", () => {
		expect(GIP_WORKFORCE_VOLUNTARY_DISPLAY).toBe(
			`< ${COMPANY_SIZE_VOLUNTARY_MAX}`,
		);
	});
});

describe("formatWorkforceForUser", () => {
	it("hides the exact headcount of a voluntary-tier company", () => {
		// The bug: only an absent company got the bracket, so a company present
		// in the GIP file with 37 employees read "37" (issue 3914).
		expect(formatWorkforceForUser(37)).toBe(GIP_WORKFORCE_VOLUNTARY_DISPLAY);
		expect(formatWorkforceForUser(0)).toBe(GIP_WORKFORCE_VOLUNTARY_DISPLAY);
	});

	it("keeps a company absent from the GIP file on the same label", () => {
		expect(formatWorkforceForUser(null)).toBe(GIP_WORKFORCE_VOLUNTARY_DISPLAY);
	});

	it("decides the tier on the exact value, not the floored one", () => {
		// Flooring first would surface "49" for a company the rule places in the
		// voluntary tier.
		expect(formatWorkforceForUser(49.8)).toBe(GIP_WORKFORCE_VOLUNTARY_DISPLAY);
	});

	it("shows the headcount from the threshold upwards, bound excluded", () => {
		expect(formatWorkforceForUser(COMPANY_SIZE_VOLUNTARY_MAX)).toBe("50");
		expect(formatWorkforceForUser(99.97)).toBe("99");
		expect(formatWorkforceForUser(250)).toBe("250");
	});

	it("brackets a negative headcount instead of surfacing it", () => {
		// parseGipWorkforce deliberately keeps a negative rather than coercing it,
		// so a corrupt GIP row reaches this formatter. It belongs to the voluntary
		// tier and must never read "-1" on a user-facing screen.
		expect(formatWorkforceForUser(-1)).toBe(GIP_WORKFORCE_VOLUNTARY_DISPLAY);
	});

	it("groups thousands with a narrow no-break space, the French way", () => {
		// Spelled out rather than compared to formatCount(12345), which would be
		// the implementation checked against itself. The narrow no-break space is
		// escaped, not pasted: U+202F is invisible in a diff and a plain space
		// would silently pass for it.
		expect(formatWorkforceForUser(12345)).toBe("12\u202f345");
	});
});

describe("floorWorkforce", () => {
	it("floors the value so 99,97 never displays as 100", () => {
		expect(floorWorkforce(99.97)).toBe(99);
		expect(floorWorkforce(70.5)).toBe(70);
		expect(floorWorkforce(99.999)).toBe(99);
	});

	it("leaves an integer value unchanged", () => {
		expect(floorWorkforce(70)).toBe(70);
		expect(floorWorkforce(0)).toBe(0);
	});

	it("returns null when the company is absent from the GIP file", () => {
		expect(floorWorkforce(null)).toBeNull();
	});

	it("never brackets a voluntary-tier headcount, unlike the user-facing format", () => {
		// Machine consumers (open-data API, SUIT export) and the back-office are
		// typed on the number and need the exact figure — bracketing them would
		// break their contract. Guards against merging the two helpers.
		expect(floorWorkforce(37)).toBe(37);
		expect(formatWorkforceForUser(37)).toBe(GIP_WORKFORCE_VOLUNTARY_DISPLAY);
	});
});

import { describe, expect, it } from "vitest";
import { isIndicatorGRequired, isTriennialYear } from "~/modules/domain";
import { evaluateComputation, loadRules } from "../engine";

// Anti-drift lock (#4043): the versioned ruleset (v2027.1.json) carries a JSON
// mirror of `isIndicatorGRequired`. The single-source-of-truth rule forbids two
// diverging copies of a business rule, so this test evaluates the JSON
// computation over a workforce × year matrix and requires it to equal the domain
// function. It fails if either copy evolves without the other.
const rules = loadRules("2027.1");

const WORKFORCES = [0, 30, 49, 50, 75, 99, 100, 149, 150, 249, 250, 300];
const YEARS = [2018, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

const CASES = WORKFORCES.flatMap((workforce) =>
	YEARS.map((year) => ({ workforce, year })),
);

describe("indicatorGRequired parity — engine ruleset ↔ domain function", () => {
	it.each(CASES)("workforce $workforce · year $year", ({ workforce, year }) => {
		// Facts assembled exactly like buildSubmitFacts in production: `year` plus
		// the pre-computed `isTriennialYear` boolean.
		const facts = {
			workforce,
			year,
			isTriennialYear: isTriennialYear(year),
		};
		expect(evaluateComputation(rules, "indicatorGRequired", facts)).toBe(
			isIndicatorGRequired(workforce, year),
		);
	});
});

import { describe, expect, it } from "vitest";

import { formatFrenchDate } from "../formatFrenchDate";

describe("formatFrenchDate", () => {
	it("formats a date in French locale with day, month name, and year", () => {
		const date = new Date(2026, 2, 10); // March 10, 2026
		expect(formatFrenchDate(date)).toBe("10 mars 2026");
	});

	it("formats January 1st correctly", () => {
		const date = new Date(2025, 0, 1); // January 1, 2025
		expect(formatFrenchDate(date)).toBe("1 janvier 2025");
	});

	it("formats December 31st correctly", () => {
		const date = new Date(2024, 11, 31); // December 31, 2024
		expect(formatFrenchDate(date)).toBe("31 décembre 2024");
	});
});

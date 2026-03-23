import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCseYear, getCurrentYear } from "../shared/campaign";

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

describe("getCseYear", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns current year + 1", () => {
		vi.setSystemTime(new Date("2025-06-15"));
		expect(getCseYear()).toBe(2026);
	});
});

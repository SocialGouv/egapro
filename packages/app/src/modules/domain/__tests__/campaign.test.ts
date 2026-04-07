import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	getCurrentYear,
	getDeclarationDeadline,
	getSecondDeclarationDeadline,
	getWorkforceYear,
} from "../shared/campaign";

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

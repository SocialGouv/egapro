import { afterEach, describe, expect, it, vi } from "vitest";

import { civilDate, isCivilDayOver } from "../shared/civilDate";

describe("civilDate", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it.each([
		"Europe/Paris",
		"America/Cayenne",
		"Pacific/Tahiti",
	])("holds the calendar day as UTC midnight under %s", (timeZone) => {
		vi.stubEnv("TZ", timeZone);
		expect(civilDate(2026, 5, 1).toISOString()).toBe(
			"2026-06-01T00:00:00.000Z",
		);
	});

	it("rolls an out-of-range day over like Date does", () => {
		expect(civilDate(2027, 0, 0).toISOString()).toBe(
			"2026-12-31T00:00:00.000Z",
		);
	});
});

describe("isCivilDayOver", () => {
	const day = civilDate(2026, 11, 31);

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it.each([
		["its first millisecond", "2026-12-31T00:00:00.000Z"],
		["one minute in", "2026-12-31T00:01:00.000Z"],
		["its last millisecond", "2026-12-31T23:59:59.999Z"],
		["the day before", "2026-12-30T12:00:00.000Z"],
	])("is not over at %s", (_label, now) => {
		expect(isCivilDayOver(day, new Date(now))).toBe(false);
	});

	it.each([
		["the first millisecond of the next day", "2027-01-01T00:00:00.000Z"],
		["later on", "2027-06-15T00:00:00.000Z"],
	])("is over at %s", (_label, now) => {
		expect(isCivilDayOver(day, new Date(now))).toBe(true);
	});

	it("does not depend on the process time zone", () => {
		vi.stubEnv("TZ", "Pacific/Tahiti");
		expect(isCivilDayOver(day, new Date("2026-12-31T23:59:59.999Z"))).toBe(
			false,
		);
		expect(isCivilDayOver(day, new Date("2027-01-01T00:00:00.000Z"))).toBe(
			true,
		);
	});
});

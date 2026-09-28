import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	getTodayInParisCivilDate,
	getTodayInParisCivilDateString,
	isYearPubliclyReleased,
} from "~/modules/domain";
import {
	isYearPubliclyReleased as fromSource,
	getTodayInParisCivilDate as getTodayDateFromSource,
	getTodayInParisCivilDateString as getTodayStringFromSource,
} from "../shared/publicData";

describe("isYearPubliclyReleased", () => {
	it("returns false when no release date has been set", () => {
		expect(isYearPubliclyReleased(null, new Date("2026-06-01"))).toBe(false);
	});

	it("returns false when today is before the release date", () => {
		expect(
			isYearPubliclyReleased(new Date("2026-06-01"), new Date("2026-05-31")),
		).toBe(false);
	});

	it("returns true when today equals the release date", () => {
		expect(
			isYearPubliclyReleased(new Date("2026-06-01"), new Date("2026-06-01")),
		).toBe(true);
	});

	it("returns true when today is after the release date", () => {
		expect(
			isYearPubliclyReleased(new Date("2026-06-01"), new Date("2026-06-02")),
		).toBe(true);
	});

	it("treats a release date one millisecond in the future as not released", () => {
		const releaseDate = new Date("2026-06-01T00:00:00.000Z");
		const today = new Date("2026-06-01T00:00:00.000Z");
		today.setMilliseconds(today.getMilliseconds() - 1);
		expect(isYearPubliclyReleased(releaseDate, today)).toBe(false);
	});

	it("re-exports the same function through the domain barrel", () => {
		expect(isYearPubliclyReleased).toBe(fromSource);
	});
});

describe("getTodayInParisCivilDateString", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the next Paris day at 22:30 UTC in summer", () => {
		vi.setSystemTime(new Date("2026-06-30T22:30:00Z"));
		expect(getTodayInParisCivilDateString()).toBe("2026-07-01");
	});

	it("returns the same day at 21:30 UTC in summer", () => {
		vi.setSystemTime(new Date("2026-06-30T21:30:00Z"));
		expect(getTodayInParisCivilDateString()).toBe("2026-06-30");
	});

	it("returns the same day at 22:30 UTC in winter", () => {
		vi.setSystemTime(new Date("2026-01-15T22:30:00Z"));
		expect(getTodayInParisCivilDateString()).toBe("2026-01-15");
	});

	it("returns the next Paris day at 23:30 UTC in winter", () => {
		vi.setSystemTime(new Date("2026-01-15T23:30:00Z"));
		expect(getTodayInParisCivilDateString()).toBe("2026-01-16");
	});

	it("re-exports the same function through the domain barrel", () => {
		expect(getTodayInParisCivilDateString).toBe(getTodayStringFromSource);
	});
});

describe("getTodayInParisCivilDate", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the Paris civil date at UTC midnight", () => {
		vi.setSystemTime(new Date("2026-06-30T22:30:00Z"));
		expect(getTodayInParisCivilDate()).toEqual(
			new Date("2026-07-01T00:00:00Z"),
		);
	});

	it("keeps a release date unreleased until the last second of the previous Paris day", () => {
		vi.setSystemTime(new Date("2026-06-30T21:59:59Z"));
		expect(
			isYearPubliclyReleased(
				new Date("2026-07-01T00:00:00Z"),
				getTodayInParisCivilDate(),
			),
		).toBe(false);
	});

	it("releases the year exactly at Paris midnight", () => {
		vi.setSystemTime(new Date("2026-06-30T22:00:00Z"));
		expect(
			isYearPubliclyReleased(
				new Date("2026-07-01T00:00:00Z"),
				getTodayInParisCivilDate(),
			),
		).toBe(true);
	});

	it("re-exports the same function through the domain barrel", () => {
		expect(getTodayInParisCivilDate).toBe(getTodayDateFromSource);
	});
});

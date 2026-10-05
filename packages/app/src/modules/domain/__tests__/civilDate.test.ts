import { afterEach, describe, expect, it, vi } from "vitest";

import { civilDate } from "../shared/civilDate";

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

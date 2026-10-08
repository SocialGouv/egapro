import { afterEach, describe, expect, it, vi } from "vitest";

import { parseCivilDate } from "../parseCivilDate";

describe("parseCivilDate", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it.each([
		"Europe/Paris",
		"America/Cayenne",
		"Pacific/Tahiti",
	])("reads a stored civil date as UTC midnight under %s", (timeZone) => {
		vi.stubEnv("TZ", timeZone);
		expect(parseCivilDate("2027-03-01").toISOString()).toBe(
			"2027-03-01T00:00:00.000Z",
		);
	});
});

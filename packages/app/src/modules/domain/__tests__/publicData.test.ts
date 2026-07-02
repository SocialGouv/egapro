import { describe, expect, it } from "vitest";

import { isYearPubliclyReleased } from "~/modules/domain";
import { isYearPubliclyReleased as fromSource } from "../shared/publicData";

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

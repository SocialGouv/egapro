import { describe, expect, it } from "vitest";

import { elapsedSeconds } from "~/modules/analytics";

describe("elapsedSeconds", () => {
	it("returns the gap between two timestamps rounded to whole seconds", () => {
		expect(elapsedSeconds(1_000, 6_000)).toBe(5);
	});

	it("rounds to the nearest second", () => {
		expect(elapsedSeconds(0, 1_400)).toBe(1);
		expect(elapsedSeconds(0, 1_600)).toBe(2);
	});

	it("returns 0 for identical timestamps", () => {
		expect(elapsedSeconds(5_000, 5_000)).toBe(0);
	});
});

import { describe, expect, it } from "vitest";

import { formatNafForDisplay } from "../formatNafForDisplay";

describe("formatNafForDisplay", () => {
	it("combines the code and the label when both are present", () => {
		expect(
			formatNafForDisplay("6202A", "Conseil en systèmes et logiciels"),
		).toBe("6202A — Conseil en systèmes et logiciels");
	});

	it("falls back to the code alone when the label is missing", () => {
		expect(formatNafForDisplay("6202A", null)).toBe("6202A");
	});

	it("falls back to the label alone when the code is missing", () => {
		expect(formatNafForDisplay(null, "Conseil en systèmes et logiciels")).toBe(
			"Conseil en systèmes et logiciels",
		);
	});

	it("returns null when both are missing", () => {
		expect(formatNafForDisplay(null, null)).toBeNull();
	});
});

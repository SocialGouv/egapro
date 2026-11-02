import { describe, expect, it } from "vitest";

import { formatNaf } from "../formatNaf";

describe("formatNaf", () => {
	it("joins the code and the label", () => {
		expect(formatNaf("62.02A", "Conseil informatique")).toBe(
			"62.02A - Conseil informatique",
		);
	});

	it("falls back on whichever part is known", () => {
		expect(formatNaf("62.02A", null)).toBe("62.02A");
		expect(formatNaf(null, "Conseil informatique")).toBe(
			"Conseil informatique",
		);
	});

	it("prints a dash when nothing is known", () => {
		expect(formatNaf(null, null)).toBe("-");
		expect(formatNaf("", "")).toBe("-");
	});
});

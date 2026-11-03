import { describe, expect, it } from "vitest";
import { describedByForField } from "../types";

describe("describedByForField", () => {
	it("points at the required note given by the caller", () => {
		expect(describedByForField("alert", undefined, "custom-note")).toBe(
			"custom-note",
		);
	});

	it("appends the alert of the field error after the required note", () => {
		expect(
			describedByForField(
				"alert",
				{ fieldId: "f", category: "invalid", message: "m" },
				"custom-note",
			),
		).toBe("custom-note alert-invalid");
	});
});

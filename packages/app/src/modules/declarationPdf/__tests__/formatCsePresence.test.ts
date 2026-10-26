import { describe, expect, it } from "vitest";

import { formatCsePresence } from "../formatCsePresence";

describe("formatCsePresence", () => {
	it("answers yes or no once the company told", () => {
		expect(formatCsePresence(true)).toBe("Oui");
		expect(formatCsePresence(false)).toBe("Non");
	});

	it("says it is unknown while the company has not told", () => {
		expect(formatCsePresence(null)).toBe("Non renseigné");
	});
});

import { describe, expect, it } from "vitest";

import { formatSiren } from "../formatSiren";

describe("formatSiren", () => {
	it("formats a 9-digit SIREN with spaces", () => {
		expect(formatSiren("532847196")).toBe("532 847 196");
	});
});

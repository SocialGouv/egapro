import { describe, expect, it } from "vitest";

import { fetchCompanyName } from "../weez";

describe("fetchCompanyName", () => {
	it("returns a fallback name for any SIREN", async () => {
		const name = await fetchCompanyName("123456789");
		expect(name).toBe("Entreprise 123456789");
	});

	it("returns a fallback name for another SIREN", async () => {
		const name = await fetchCompanyName("999999999");
		expect(name).toBe("Entreprise 999999999");
	});
});

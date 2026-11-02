import { describe, expect, it } from "vitest";
import { parsePublicSearchInput } from "../schemas";

function params(query: string): URLSearchParams {
	return new URLSearchParams(query);
}

describe("parsePublicSearchInput", () => {
	it("leaves the page out, so an export is never refused over it", () => {
		const parsed = parsePublicSearchInput(params("year=2026&limit=500"));

		expect(parsed.success).toBe(true);
		expect(parsed.data?.year).toBe(2026);
	});
});

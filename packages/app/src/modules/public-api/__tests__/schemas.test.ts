import { describe, expect, it } from "vitest";
import {
	PUBLIC_SEARCH_DEFAULT_LIMIT,
	parsePublicRepresentationSearchPage,
	parsePublicSearchInput,
	parsePublicSearchPage,
} from "../schemas";

function params(query: string): URLSearchParams {
	return new URLSearchParams(query);
}

describe("parsePublicSearchPage", () => {
	it("reads the filters, the repeatable facets and the page", () => {
		const parsed = parsePublicSearchPage(
			params(
				"q=acme&region=11&region=84&workforceMin=50&year=2026&sort=name&limit=20&offset=40",
			),
		);

		expect(parsed.success).toBe(true);
		expect(parsed.data).toMatchObject({
			q: "acme",
			region: ["11", "84"],
			workforceMin: 50,
			year: 2026,
			sort: "name",
			limit: 20,
			offset: 40,
		});
	});

	it("defaults the page when none is requested", () => {
		const parsed = parsePublicSearchPage(params(""));

		expect(parsed.data).toMatchObject({
			limit: PUBLIC_SEARCH_DEFAULT_LIMIT,
			offset: 0,
		});
	});

	it("names the invalid parameter", () => {
		const parsed = parsePublicSearchPage(params("limit=500"));

		expect(parsed.success).toBe(false);
		expect(parsed.error?.issues[0]?.path).toEqual(["limit"]);
	});
});

describe("parsePublicSearchInput", () => {
	it("leaves the page out, so an export is never refused over it", () => {
		const parsed = parsePublicSearchInput(params("year=2026&limit=500"));

		expect(parsed.success).toBe(true);
		expect(parsed.data?.year).toBe(2026);
	});
});

describe("parsePublicRepresentationSearchPage", () => {
	it("reads the shared filters and the page", () => {
		const parsed = parsePublicRepresentationSearchPage(
			params("naf=62.01Z&year=2026&limit=50&offset=10"),
		);

		expect(parsed.success).toBe(true);
		expect(parsed.data).toMatchObject({
			naf: ["62.01Z"],
			year: 2026,
			limit: 50,
			offset: 10,
		});
	});

	it("ignores the parameters only the declarations search knows", () => {
		const parsed = parsePublicRepresentationSearchPage(
			params("sort=unknown&city=Paris&workforceRanges=unknown"),
		);

		expect(parsed.success).toBe(true);
		expect(parsed.data).not.toHaveProperty("sort");
		expect(parsed.data).not.toHaveProperty("city");
	});
});

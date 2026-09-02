import { describe, expect, it } from "vitest";
import {
	backToSearchHref,
	exportHref,
	parseConsultationSearchParams,
	searchHref,
	toPublicSearchInput,
} from "./searchParams";

describe("parseConsultationSearchParams", () => {
	it("reads a facet whether it appears once, several times, or not at all", () => {
		const params = parseConsultationSearchParams({
			region: "11",
			departement: ["75", "92"],
		});

		expect(params.region).toEqual(["11"]);
		expect(params.departement).toEqual(["75", "92"]);
		expect(params.naf).toEqual([]);
	});

	it("drops blanks so an empty facet never becomes a filter", () => {
		const params = parseConsultationSearchParams({ region: ["", "  ", "11"] });

		expect(params.region).toEqual(["11"]);
	});

	it("drops an unknown workforce bracket rather than widening the search", () => {
		const params = parseConsultationSearchParams({
			workforceRanges: ["50-99", "gigantesque"],
		});

		expect(params.workforceRanges).toEqual(["50-99"]);
	});

	it("falls back to the defaults on unusable page and limit values", () => {
		const params = parseConsultationSearchParams({
			page: "-3",
			limit: "7",
		});

		expect(params.page).toBe(1);
		expect(params.limit).toBe(10);
	});

	it("keeps a page size the selector actually offers", () => {
		expect(parseConsultationSearchParams({ limit: "50" }).limit).toBe(50);
	});
});

describe("toPublicSearchInput", () => {
	it("omits empty facets and derives the offset from the page size", () => {
		const input = toPublicSearchInput(
			parseConsultationSearchParams({ page: "3", limit: "25", region: "11" }),
		);

		expect(input.region).toEqual(["11"]);
		expect(input.departement).toBeUndefined();
		expect(input.limit).toBe(25);
		expect(input.offset).toBe(50);
	});
});

describe("searchHref", () => {
	it("repeats a facet key per value and hides the defaults", () => {
		const href = searchHref(
			parseConsultationSearchParams({ region: ["11", "84"], q: "acme" }),
		);

		expect(href).toBe("/index-egapro/recherche?q=acme&region=11&region=84");
	});

	it("carries the criteria over to another page", () => {
		const href = searchHref(parseConsultationSearchParams({ naf: "C" }), {
			page: 4,
		});

		expect(href).toBe("/index-egapro/recherche?naf=C&page=4");
	});
});

describe("backToSearchHref", () => {
	it("rebuilds the search a company page was reached from", () => {
		expect(backToSearchHref("q=Atelier&region=11&region=84&page=3")).toBe(
			"/index-egapro/recherche?q=Atelier&region=11&region=84&page=3",
		);
	});

	it("falls back to the bare search when nothing was carried", () => {
		expect(backToSearchHref(undefined)).toBe("/index-egapro/recherche");
		expect(backToSearchHref("")).toBe("/index-egapro/recherche");
	});

	it("drops keys the search does not own instead of reflecting them", () => {
		expect(
			backToSearchHref("q=Atelier&evil=%3Cscript%3E&next=//example.com"),
		).toBe("/index-egapro/recherche?q=Atelier");
	});
});

describe("exportHref", () => {
	it("carries every active facet but not pagination", () => {
		const params = parseConsultationSearchParams({
			q: "Atelier",
			region: ["11", "84"],
			departement: "75",
			naf: ["C", "J"],
			workforceRanges: "1000+",
			page: "3",
			limit: "25",
		});

		expect(exportHref("/api/public/declarations/export", params)).toBe(
			"/api/public/declarations/export?format=csv&q=Atelier&region=11&region=84&departement=75&naf=C&naf=J&workforceRanges=1000%2B",
		);
	});
});

import { describe, expect, it } from "vitest";
import {
	hasSearchCriteria,
	parseConsultationSearchParams,
	toPublicSearchInput,
} from "./searchParams";

describe("consultation search params", () => {
	it("normalizes filters and pagination for the public service", () => {
		const params = parseConsultationSearchParams({
			q: "  Acme  ",
			city: "Paris",
			region: "Île-de-France",
			departement: "75",
			naf: "J",
			workforce: "100-249",
			year: "2024",
			sort: "name",
			page: "3",
		});

		expect(toPublicSearchInput(params)).toEqual({
			q: "Acme",
			city: "Paris",
			region: "Île-de-France",
			departement: "75",
			naf: "J",
			workforceMin: 100,
			workforceMax: 249,
			year: 2024,
			sort: "name",
			limit: 50,
			offset: 100,
		});
	});

	it("does not query until at least one criterion is present", () => {
		expect(hasSearchCriteria(parseConsultationSearchParams({}))).toBe(false);
		expect(hasSearchCriteria(parseConsultationSearchParams({ naf: "C" }))).toBe(
			true,
		);
	});
});

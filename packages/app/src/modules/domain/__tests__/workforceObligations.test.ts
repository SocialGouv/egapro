import { describe, expect, it } from "vitest";

import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	V2_FIRST_CAMPAIGN_YEAR,
} from "../shared/constants";
import {
	INDICATOR_G_ANNUAL_MIN,
	INDICATOR_G_TRIENNIAL_MIN,
} from "../shared/indicatorG";
import {
	REPRESENTATION_SUBJECTION_WINDOW_YEARS,
	REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
} from "../shared/representation";
import {
	findDeclarationCadence,
	getWorkforceObligations,
	WORKFORCE_OBLIGATION_BRACKET_KEYS,
	WORKFORCE_OBLIGATION_BRACKETS,
} from "../shared/workforceObligations";

const NNBSP = " ";

describe("WORKFORCE_OBLIGATION_BRACKETS", () => {
	it("lists the six brackets in display order", () => {
		expect(WORKFORCE_OBLIGATION_BRACKET_KEYS).toEqual([
			"<50",
			"50-99",
			"100-149",
			"150-249",
			"250-999",
			"1000+",
		]);
	});

	it("covers 0 to infinity without gap nor overlap", () => {
		const brackets = WORKFORCE_OBLIGATION_BRACKET_KEYS.map(
			(key) => WORKFORCE_OBLIGATION_BRACKETS[key],
		);
		expect(brackets[0]?.min).toBe(0);
		expect(brackets.at(-1)?.max).toBeNull();
		for (let index = 1; index < brackets.length; index++) {
			expect(brackets[index]?.min).toBe(
				(brackets[index - 1]?.max ?? Number.NaN) + 1,
			);
		}
	});

	it("starts each bracket on the threshold constant where an obligation changes", () => {
		expect(WORKFORCE_OBLIGATION_BRACKETS["50-99"].min).toBe(
			COMPANY_SIZE_VOLUNTARY_MAX,
		);
		expect(WORKFORCE_OBLIGATION_BRACKETS["100-149"].min).toBe(
			COMPANY_SIZE_ANNUAL_MIN,
		);
		expect(WORKFORCE_OBLIGATION_BRACKETS["150-249"].min).toBe(
			INDICATOR_G_TRIENNIAL_MIN,
		);
		expect(WORKFORCE_OBLIGATION_BRACKETS["250-999"].min).toBe(
			INDICATOR_G_ANNUAL_MIN,
		);
		expect(WORKFORCE_OBLIGATION_BRACKETS["1000+"].min).toBe(
			REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
		);
	});

	it("labels each bracket in French with grouped thousands", () => {
		expect(
			WORKFORCE_OBLIGATION_BRACKET_KEYS.map(
				(key) => WORKFORCE_OBLIGATION_BRACKETS[key].label,
			),
		).toEqual([
			"Moins de 50 salariés",
			"50 à 99 salariés",
			"100 à 149 salariés",
			"150 à 249 salariés",
			"250 à 999 salariés",
			`1${NNBSP}000 salariés et plus`,
		]);
	});
});

describe("findDeclarationCadence", () => {
	it("returns the first V2 year and the gap to the next one", () => {
		expect(
			findDeclarationCadence((year) => year >= V2_FIRST_CAMPAIGN_YEAR + 2),
		).toEqual({ fromYear: V2_FIRST_CAMPAIGN_YEAR + 2, everyYears: 1 });
	});

	it("never starts before the first V2 campaign year", () => {
		expect(findDeclarationCadence(() => true)).toEqual({
			fromYear: V2_FIRST_CAMPAIGN_YEAR,
			everyYears: 1,
		});
	});

	it("returns null when the rule never holds", () => {
		expect(findDeclarationCadence(() => false)).toBeNull();
	});

	it("returns null when the rule holds once and never repeats", () => {
		expect(
			findDeclarationCadence((year) => year === V2_FIRST_CAMPAIGN_YEAR),
		).toBeNull();
	});
});

describe("getWorkforceObligations", () => {
	it("gives no obligation below 50 employees", () => {
		expect(getWorkforceObligations("<50")).toEqual({ mandatory: false });
	});

	it("requires 50-99 to declare prefilled indicators yearly and indicator G every 3 years from 2030", () => {
		expect(getWorkforceObligations("50-99")).toEqual({
			mandatory: true,
			prefilledIndicators: { fromYear: 2027, everyYears: 1 },
			categoryIndicator: { fromYear: 2030, everyYears: 3 },
			cseOpinion: false,
			representation: null,
		});
	});

	it("adds the CSE opinion from 100 employees", () => {
		expect(getWorkforceObligations("100-149")).toEqual({
			mandatory: true,
			prefilledIndicators: { fromYear: 2027, everyYears: 1 },
			categoryIndicator: { fromYear: 2030, everyYears: 3 },
			cseOpinion: true,
			representation: null,
		});
	});

	it("brings indicator G forward to 2027, every 3 years, from 150 employees", () => {
		expect(getWorkforceObligations("150-249")).toEqual({
			mandatory: true,
			prefilledIndicators: { fromYear: 2027, everyYears: 1 },
			categoryIndicator: { fromYear: 2027, everyYears: 3 },
			cseOpinion: true,
			representation: null,
		});
	});

	it("makes indicator G yearly from 250 employees", () => {
		expect(getWorkforceObligations("250-999")).toEqual({
			mandatory: true,
			prefilledIndicators: { fromYear: 2027, everyYears: 1 },
			categoryIndicator: { fromYear: 2027, everyYears: 1 },
			cseOpinion: true,
			representation: null,
		});
	});

	it("adds the representation indicators from 1 000 employees over the subjection window", () => {
		expect(getWorkforceObligations("1000+")).toEqual({
			mandatory: true,
			prefilledIndicators: { fromYear: 2027, everyYears: 1 },
			categoryIndicator: { fromYear: 2027, everyYears: 1 },
			cseOpinion: true,
			representation: {
				workforceMin: REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
				subjectionWindowYears: REPRESENTATION_SUBJECTION_WINDOW_YEARS,
			},
		});
	});
});

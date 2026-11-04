import type { WorkforceObligationBracket } from "../types";
import { isObligatedForYear } from "./companyObligation";
import { isCseRequired } from "./companySize";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	V2_FIRST_CAMPAIGN_YEAR,
} from "./constants";
import { formatCount } from "./format";
import {
	INDICATOR_G_ANNUAL_MIN,
	INDICATOR_G_TRIENNIAL_MIN,
	isIndicatorGRequired,
} from "./indicatorG";
import {
	REPRESENTATION_SUBJECTION_WINDOW_YEARS,
	REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
} from "./representation";

const CADENCE_SEARCH_HORIZON_YEARS = 12;

export type DeclarationCadence = { fromYear: number; everyYears: number };

export type WorkforceObligations =
	| { mandatory: false }
	| {
			mandatory: true;
			prefilledIndicators: DeclarationCadence;
			categoryIndicator: DeclarationCadence | null;
			cseOpinion: boolean;
			representation: {
				workforceMin: number;
				subjectionWindowYears: number;
			} | null;
	  };

type BracketBounds = { min: number; max: number | null; label: string };

function closedBracket(min: number, nextMin: number): BracketBounds {
	const max = nextMin - 1;
	return {
		min,
		max,
		label: `${formatCount(min)} à ${formatCount(max)} salariés`,
	};
}

export const WORKFORCE_OBLIGATION_BRACKETS: Record<
	WorkforceObligationBracket,
	BracketBounds
> = {
	"<50": {
		min: 0,
		max: COMPANY_SIZE_VOLUNTARY_MAX - 1,
		label: `Moins de ${formatCount(COMPANY_SIZE_VOLUNTARY_MAX)} salariés`,
	},
	"50-99": closedBracket(COMPANY_SIZE_VOLUNTARY_MAX, COMPANY_SIZE_ANNUAL_MIN),
	"100-149": closedBracket(COMPANY_SIZE_ANNUAL_MIN, INDICATOR_G_TRIENNIAL_MIN),
	"150-249": closedBracket(INDICATOR_G_TRIENNIAL_MIN, INDICATOR_G_ANNUAL_MIN),
	"250-999": closedBracket(
		INDICATOR_G_ANNUAL_MIN,
		REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
	),
	"1000+": {
		min: REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
		max: null,
		label: `${formatCount(REPRESENTATION_SUBJECTION_WORKFORCE_MIN)} salariés et plus`,
	},
};

export const WORKFORCE_OBLIGATION_BRACKET_KEYS = Object.keys(
	WORKFORCE_OBLIGATION_BRACKETS,
) as WorkforceObligationBracket[];

function firstYearWhere(
	isRequired: (year: number) => boolean,
	afterYear: number,
): number | null {
	for (
		let year = afterYear + 1;
		year <= afterYear + CADENCE_SEARCH_HORIZON_YEARS;
		year++
	) {
		if (isRequired(year)) return year;
	}
	return null;
}

export function findDeclarationCadence(
	isRequired: (year: number) => boolean,
): DeclarationCadence | null {
	const fromYear = firstYearWhere(isRequired, V2_FIRST_CAMPAIGN_YEAR - 1);
	if (fromYear === null) return null;
	const nextYear = firstYearWhere(isRequired, fromYear);
	if (nextYear === null) return null;
	return { fromYear, everyYears: nextYear - fromYear };
}

export function getWorkforceObligations(
	bracket: WorkforceObligationBracket,
): WorkforceObligations {
	const { min } = WORKFORCE_OBLIGATION_BRACKETS[bracket];
	const prefilledIndicators = findDeclarationCadence((year) =>
		isObligatedForYear(min, year),
	);
	if (prefilledIndicators === null) return { mandatory: false };
	return {
		mandatory: true,
		prefilledIndicators,
		categoryIndicator: findDeclarationCadence((year) =>
			isIndicatorGRequired(min, year),
		),
		cseOpinion: isCseRequired(min),
		representation:
			min >= REPRESENTATION_SUBJECTION_WORKFORCE_MIN
				? {
						workforceMin: REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
						subjectionWindowYears: REPRESENTATION_SUBJECTION_WINDOW_YEARS,
					}
				: null,
	};
}

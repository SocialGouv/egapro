import type { GipPrefillData } from "~/modules/declaration-remuneration";

import {
	buildPrefillPdfData,
	type PrefillPdfCompany,
	type PrefillPdfData,
} from "../../buildPrefillPdfData";

export const DEMO_COMPANY: PrefillPdfCompany = {
	name: "Société Démo",
	address: "1 rue de la Démo, 75001 Paris",
	nafCode: "62.02A",
	nafLabel: "Conseil en systèmes et logiciels informatiques",
	hasCse: true,
};

export function makeGip(
	overrides: Partial<GipPrefillData> = {},
): GipPrefillData {
	return {
		step1: { totalWomen: 120, totalMen: 100, hourlyWomen: 50, hourlyMen: 100 },
		step2: {
			annualMeanWomen: "35050.21",
			annualMeanMen: "36739.82",
			annualMeanGap: "0.046",
			hourlyMeanWomen: "13.21",
			hourlyMeanMen: "14.23",
			hourlyMeanGap: "0.0717",
			annualMedianWomen: "34110.90",
			annualMedianMen: "35739.82",
			annualMedianGap: "0.046",
			hourlyMedianWomen: "12.21",
			hourlyMedianMen: "13.23",
			hourlyMedianGap: "0.0772",
		},
		step3: {
			annualMeanWomen: "473.93",
			annualMeanMen: "476.29",
			annualMeanGap: "0.005",
			hourlyMeanWomen: "2.72",
			hourlyMeanMen: "3.43",
			hourlyMeanGap: "0.207",
			annualMedianWomen: "443.93",
			annualMedianMen: "456.29",
			annualMedianGap: "0.0271",
			hourlyMedianWomen: "2.22",
			hourlyMedianMen: "3.23",
			hourlyMedianGap: "0.3127",
			beneficiaryCountWomen: 60,
			beneficiaryCountMen: 70,
		},
		step4: {
			annual: {
				thresholds: ["20700.35", "25750.99", "1734900.99"],
				womenCounts: [60, 40, 24, 15],
				menCounts: [30, 30, 31, 26],
			},
			hourly: {
				thresholds: ["7.20", "10.12", "12.92"],
				womenCounts: [20, 16, 15, 4],
				menCounts: [23, 18, 18, 9],
			},
		},
		confidenceIndex: "0.95",
		periodStart: "2026-01-01",
		periodEnd: "2026-12-31",
		...overrides,
	};
}

export function makePrefillData(
	overrides: {
		gip?: Partial<GipPrefillData>;
		workforceEma?: string | number | null;
		company?: PrefillPdfCompany;
	} = {},
): PrefillPdfData {
	return buildPrefillPdfData({
		siren: "123456789",
		year: 2027,
		gip: makeGip(overrides.gip),
		workforceEma:
			"workforceEma" in overrides
				? (overrides.workforceEma ?? null)
				: "2256.00",
		company: "company" in overrides ? overrides.company : DEMO_COMPANY,
	});
}

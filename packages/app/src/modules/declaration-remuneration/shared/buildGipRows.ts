import type { PayGapRow } from "../types";

type GipStepData = {
	annualMeanWomen?: string | null;
	annualMeanMen?: string | null;
	hourlyMeanWomen?: string | null;
	hourlyMeanMen?: string | null;
	annualMedianWomen?: string | null;
	annualMedianMen?: string | null;
	hourlyMedianWomen?: string | null;
	hourlyMedianMen?: string | null;
};

/**
 * Transform GIP prefill step data (step2 or step3) into PayGapRow[].
 * Shared between Step2PayGap and Step3VariablePay.
 */
export function buildGipRows(gip: GipStepData): PayGapRow[] {
	return [
		{
			label: "Annuelle brute moyenne",
			womenValue: gip.annualMeanWomen ?? "",
			menValue: gip.annualMeanMen ?? "",
		},
		{
			label: "Horaire brute moyenne",
			womenValue: gip.hourlyMeanWomen ?? "",
			menValue: gip.hourlyMeanMen ?? "",
		},
		{
			label: "Annuelle brute médiane",
			womenValue: gip.annualMedianWomen ?? "",
			menValue: gip.annualMedianMen ?? "",
		},
		{
			label: "Horaire brute médiane",
			womenValue: gip.hourlyMedianWomen ?? "",
			menValue: gip.hourlyMedianMen ?? "",
		},
	];
}

import type { Step2Data, Step3Data } from "../types";
import type { GipPrefillData } from "./gipMdsMapping";

export function gipToStep2(gip: GipPrefillData["step2"]): Step2Data {
	return {
		indicatorAAnnualWomen: gip.annualMeanWomen ?? "",
		indicatorAAnnualMen: gip.annualMeanMen ?? "",
		indicatorAHourlyWomen: gip.hourlyMeanWomen ?? "",
		indicatorAHourlyMen: gip.hourlyMeanMen ?? "",
		indicatorCAnnualWomen: gip.annualMedianWomen ?? "",
		indicatorCAnnualMen: gip.annualMedianMen ?? "",
		indicatorCHourlyWomen: gip.hourlyMedianWomen ?? "",
		indicatorCHourlyMen: gip.hourlyMedianMen ?? "",
	};
}

export function gipToStep3(gip: GipPrefillData["step3"]): Step3Data {
	return {
		indicatorBAnnualWomen: gip.annualMeanWomen ?? "",
		indicatorBAnnualMen: gip.annualMeanMen ?? "",
		indicatorBHourlyWomen: gip.hourlyMeanWomen ?? "",
		indicatorBHourlyMen: gip.hourlyMeanMen ?? "",
		indicatorDAnnualWomen: gip.annualMedianWomen ?? "",
		indicatorDAnnualMen: gip.annualMedianMen ?? "",
		indicatorDHourlyWomen: gip.hourlyMedianWomen ?? "",
		indicatorDHourlyMen: gip.hourlyMedianMen ?? "",
		indicatorEWomen: gip.beneficiaryCountWomen?.toString() ?? "",
		indicatorEMen: gip.beneficiaryCountMen?.toString() ?? "",
	};
}

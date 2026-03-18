import type { ExportRow } from "./types";

export type CategoryRow = {
	step: number;
	categoryName: string;
	womenCount: number | null;
	menCount: number | null;
	womenValue: string | null;
	menValue: string | null;
};

export type CseOpinionRow = {
	type: string;
	opinion: string | null;
	opinionDate: string | null;
};

function findCategory(
	categories: CategoryRow[],
	step: number,
	name: string,
): CategoryRow | undefined {
	return categories.find((c) => c.step === step && c.categoryName === name);
}

// ── Indicator A (step 2: pay gap) ────────────────────────────────────

type IndicatorAFields = Pick<
	ExportRow,
	| "indAAnnualMeanWomen"
	| "indAAnnualMeanMen"
	| "indAHourlyMeanWomen"
	| "indAHourlyMeanMen"
	| "indAAnnualMedianWomen"
	| "indAAnnualMedianMen"
	| "indAHourlyMedianWomen"
	| "indAHourlyMedianMen"
>;

export function mapIndicatorA(categories: CategoryRow[]): IndicatorAFields {
	const annualMean = findCategory(categories, 2, "Annuelle brute moyenne");
	const hourlyMean = findCategory(categories, 2, "Horaire brute moyenne");
	const annualMedian = findCategory(categories, 2, "Annuelle brute médiane");
	const hourlyMedian = findCategory(categories, 2, "Horaire brute médiane");

	return {
		indAAnnualMeanWomen: annualMean?.womenValue ?? null,
		indAAnnualMeanMen: annualMean?.menValue ?? null,
		indAHourlyMeanWomen: hourlyMean?.womenValue ?? null,
		indAHourlyMeanMen: hourlyMean?.menValue ?? null,
		indAAnnualMedianWomen: annualMedian?.womenValue ?? null,
		indAAnnualMedianMen: annualMedian?.menValue ?? null,
		indAHourlyMedianWomen: hourlyMedian?.womenValue ?? null,
		indAHourlyMedianMen: hourlyMedian?.menValue ?? null,
	};
}

// ── Indicator B (step 3: variable pay gap) ───────────────────────────

type IndicatorBFields = Pick<
	ExportRow,
	| "indBAnnualMeanWomen"
	| "indBAnnualMeanMen"
	| "indBHourlyMeanWomen"
	| "indBHourlyMeanMen"
	| "indBAnnualMedianWomen"
	| "indBAnnualMedianMen"
	| "indBHourlyMedianWomen"
	| "indBHourlyMedianMen"
	| "indBBeneficiariesWomen"
	| "indBBeneficiariesMen"
>;

export function mapIndicatorB(categories: CategoryRow[]): IndicatorBFields {
	const annualMean = findCategory(categories, 3, "Annuelle brute moyenne");
	const hourlyMean = findCategory(categories, 3, "Horaire brute moyenne");
	const annualMedian = findCategory(categories, 3, "Annuelle brute médiane");
	const hourlyMedian = findCategory(categories, 3, "Horaire brute médiane");
	const beneficiaries = findCategory(categories, 3, "Bénéficiaires");

	return {
		indBAnnualMeanWomen: annualMean?.womenValue ?? null,
		indBAnnualMeanMen: annualMean?.menValue ?? null,
		indBHourlyMeanWomen: hourlyMean?.womenValue ?? null,
		indBHourlyMeanMen: hourlyMean?.menValue ?? null,
		indBAnnualMedianWomen: annualMedian?.womenValue ?? null,
		indBAnnualMedianMen: annualMedian?.menValue ?? null,
		indBHourlyMedianWomen: hourlyMedian?.womenValue ?? null,
		indBHourlyMedianMen: hourlyMedian?.menValue ?? null,
		indBBeneficiariesWomen: beneficiaries?.womenValue ?? null,
		indBBeneficiariesMen: beneficiaries?.menValue ?? null,
	};
}

// ── Indicator F (step 4: quartile distribution) ──────────────────────

type IndicatorFFields = Pick<
	ExportRow,
	| "indFAnnualQ1Women"
	| "indFAnnualQ1Men"
	| "indFAnnualQ1Threshold"
	| "indFAnnualQ2Women"
	| "indFAnnualQ2Men"
	| "indFAnnualQ2Threshold"
	| "indFAnnualQ3Women"
	| "indFAnnualQ3Men"
	| "indFAnnualQ3Threshold"
	| "indFAnnualQ4Women"
	| "indFAnnualQ4Men"
	| "indFAnnualQ4Threshold"
	| "indFHourlyQ1Women"
	| "indFHourlyQ1Men"
	| "indFHourlyQ1Threshold"
	| "indFHourlyQ2Women"
	| "indFHourlyQ2Men"
	| "indFHourlyQ2Threshold"
	| "indFHourlyQ3Women"
	| "indFHourlyQ3Men"
	| "indFHourlyQ3Threshold"
	| "indFHourlyQ4Women"
	| "indFHourlyQ4Men"
	| "indFHourlyQ4Threshold"
>;

export function mapIndicatorF(categories: CategoryRow[]): IndicatorFFields {
	const aq1 = findCategory(categories, 4, "annual:1er quartile");
	const aq2 = findCategory(categories, 4, "annual:2e quartile");
	const aq3 = findCategory(categories, 4, "annual:3e quartile");
	const aq4 = findCategory(categories, 4, "annual:4e quartile");
	const hq1 = findCategory(categories, 4, "hourly:1er quartile");
	const hq2 = findCategory(categories, 4, "hourly:2e quartile");
	const hq3 = findCategory(categories, 4, "hourly:3e quartile");
	const hq4 = findCategory(categories, 4, "hourly:4e quartile");

	return {
		indFAnnualQ1Women: aq1?.womenCount ?? null,
		indFAnnualQ1Men: aq1?.menCount ?? null,
		indFAnnualQ1Threshold: aq1?.womenValue ?? null,
		indFAnnualQ2Women: aq2?.womenCount ?? null,
		indFAnnualQ2Men: aq2?.menCount ?? null,
		indFAnnualQ2Threshold: aq2?.womenValue ?? null,
		indFAnnualQ3Women: aq3?.womenCount ?? null,
		indFAnnualQ3Men: aq3?.menCount ?? null,
		indFAnnualQ3Threshold: aq3?.womenValue ?? null,
		indFAnnualQ4Women: aq4?.womenCount ?? null,
		indFAnnualQ4Men: aq4?.menCount ?? null,
		indFAnnualQ4Threshold: aq4?.womenValue ?? null,
		indFHourlyQ1Women: hq1?.womenCount ?? null,
		indFHourlyQ1Men: hq1?.menCount ?? null,
		indFHourlyQ1Threshold: hq1?.womenValue ?? null,
		indFHourlyQ2Women: hq2?.womenCount ?? null,
		indFHourlyQ2Men: hq2?.menCount ?? null,
		indFHourlyQ2Threshold: hq2?.womenValue ?? null,
		indFHourlyQ3Women: hq3?.womenCount ?? null,
		indFHourlyQ3Men: hq3?.menCount ?? null,
		indFHourlyQ3Threshold: hq3?.womenValue ?? null,
		indFHourlyQ4Women: hq4?.womenCount ?? null,
		indFHourlyQ4Men: hq4?.menCount ?? null,
		indFHourlyQ4Threshold: hq4?.womenValue ?? null,
	};
}

// ── CSE opinions ─────────────────────────────────────────────────────

type CseFields = Pick<
	ExportRow,
	| "cseOpinion1Type"
	| "cseOpinion1Opinion"
	| "cseOpinion1Date"
	| "cseOpinion2Type"
	| "cseOpinion2Opinion"
	| "cseOpinion2Date"
	| "cseOpinion3Type"
	| "cseOpinion3Opinion"
	| "cseOpinion3Date"
	| "cseOpinion4Type"
	| "cseOpinion4Opinion"
	| "cseOpinion4Date"
>;

export function mapCseOpinions(opinions: CseOpinionRow[]): CseFields {
	return {
		cseOpinion1Type: opinions[0]?.type ?? null,
		cseOpinion1Opinion: opinions[0]?.opinion ?? null,
		cseOpinion1Date: opinions[0]?.opinionDate ?? null,
		cseOpinion2Type: opinions[1]?.type ?? null,
		cseOpinion2Opinion: opinions[1]?.opinion ?? null,
		cseOpinion2Date: opinions[1]?.opinionDate ?? null,
		cseOpinion3Type: opinions[2]?.type ?? null,
		cseOpinion3Opinion: opinions[2]?.opinion ?? null,
		cseOpinion3Date: opinions[2]?.opinionDate ?? null,
		cseOpinion4Type: opinions[3]?.type ?? null,
		cseOpinion4Opinion: opinions[3]?.opinion ?? null,
		cseOpinion4Date: opinions[3]?.opinionDate ?? null,
	};
}

import type { GipGapReference } from "~/modules/domain";
import type { PayGapRow, Step2Data, Step3Data } from "../types";
import type { GipPrefillData } from "./gipMdsMapping";

const PAY_GAP_LABELS = [
	"Annuelle brute moyenne",
	"Horaire brute moyenne",
	"Annuelle brute médiane",
	"Horaire brute médiane",
] as const;

/** Authoritative gaps for the 4 pay-gap rows, in the same order as `PAY_GAP_LABELS`. */
export type PayGapReferences = [
	GipGapReference | undefined,
	GipGapReference | undefined,
	GipGapReference | undefined,
	GipGapReference | undefined,
];

const NO_REFERENCES: PayGapReferences = [
	undefined,
	undefined,
	undefined,
	undefined,
];

/** Projects a GIP pre-fill block onto the 4 pay-gap rows. */
export function gipPayGapReferences(
	gip: GipPrefillData["step2"] | GipPrefillData["step3"] | null | undefined,
): PayGapReferences {
	if (!gip) return NO_REFERENCES;
	return [
		{
			women: gip.annualMeanWomen,
			men: gip.annualMeanMen,
			gap: gip.annualMeanGap,
		},
		{
			women: gip.hourlyMeanWomen,
			men: gip.hourlyMeanMen,
			gap: gip.hourlyMeanGap,
		},
		{
			women: gip.annualMedianWomen,
			men: gip.annualMedianMen,
			gap: gip.annualMedianGap,
		},
		{
			women: gip.hourlyMedianWomen,
			men: gip.hourlyMedianMen,
			gap: gip.hourlyMedianGap,
		},
	];
}

type Step2Field = keyof Step2Data;
type Step3PayGapField = Exclude<
	keyof Step3Data,
	"indicatorEWomen" | "indicatorEMen"
>;

const STEP2_FIELD_MAP: Array<{ women: Step2Field; men: Step2Field }> = [
	{ women: "indicatorAAnnualWomen", men: "indicatorAAnnualMen" },
	{ women: "indicatorAHourlyWomen", men: "indicatorAHourlyMen" },
	{ women: "indicatorCAnnualWomen", men: "indicatorCAnnualMen" },
	{ women: "indicatorCHourlyWomen", men: "indicatorCHourlyMen" },
];

const STEP3_FIELD_MAP: Array<{
	women: Step3PayGapField;
	men: Step3PayGapField;
}> = [
	{ women: "indicatorBAnnualWomen", men: "indicatorBAnnualMen" },
	{ women: "indicatorBHourlyWomen", men: "indicatorBHourlyMen" },
	{ women: "indicatorDAnnualWomen", men: "indicatorDAnnualMen" },
	{ women: "indicatorDHourlyWomen", men: "indicatorDHourlyMen" },
];

export function step2ToRows(
	data: Step2Data,
	references: PayGapReferences = NO_REFERENCES,
): PayGapRow[] {
	return PAY_GAP_LABELS.map((label, i) => {
		const mapping = STEP2_FIELD_MAP[i];
		return {
			label,
			womenValue: mapping ? (data[mapping.women] ?? "") : "",
			menValue: mapping ? (data[mapping.men] ?? "") : "",
			gipReference: references[i],
		};
	});
}

export function step3ToRows(
	data: Step3Data,
	references: PayGapReferences = NO_REFERENCES,
): PayGapRow[] {
	return PAY_GAP_LABELS.map((label, i) => {
		const mapping = STEP3_FIELD_MAP[i];
		return {
			label,
			womenValue: mapping ? (data[mapping.women] ?? "") : "",
			menValue: mapping ? (data[mapping.men] ?? "") : "",
			gipReference: references[i],
		};
	});
}

export function getStep2FieldName(
	rowIndex: number,
	field: "womenValue" | "menValue",
): Step2Field {
	const mapping = STEP2_FIELD_MAP[rowIndex];
	if (!mapping) throw new Error(`Invalid step2 row index: ${rowIndex}`);
	return field === "womenValue" ? mapping.women : mapping.men;
}

export function getStep3FieldName(
	rowIndex: number,
	field: "womenValue" | "menValue",
): Step3PayGapField {
	const mapping = STEP3_FIELD_MAP[rowIndex];
	if (!mapping) throw new Error(`Invalid step3 row index: ${rowIndex}`);
	return field === "womenValue" ? mapping.women : mapping.men;
}

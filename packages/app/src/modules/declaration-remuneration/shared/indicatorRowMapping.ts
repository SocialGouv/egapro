import type { PayGapRow, Step2Data, Step3Data } from "../types";

const PAY_GAP_LABELS = [
	"Annuelle brute moyenne",
	"Horaire brute moyenne",
	"Annuelle brute médiane",
	"Horaire brute médiane",
] as const;

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

export function step2ToRows(data: Step2Data): PayGapRow[] {
	return PAY_GAP_LABELS.map((label, i) => ({
		label,
		womenValue: data[STEP2_FIELD_MAP[i]!.women] ?? "",
		menValue: data[STEP2_FIELD_MAP[i]!.men] ?? "",
	}));
}

export function step3ToRows(data: Step3Data): PayGapRow[] {
	return PAY_GAP_LABELS.map((label, i) => ({
		label,
		womenValue: data[STEP3_FIELD_MAP[i]!.women] ?? "",
		menValue: data[STEP3_FIELD_MAP[i]!.men] ?? "",
	}));
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

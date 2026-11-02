import {
	formatCurrencyFixedTwo,
	formatGap,
	formatVariablePayProportion,
	gapFavoredSex,
	gapMagnitude,
	resolveGap,
	variablePayProportion,
} from "~/modules/domain";
import { quartileGenderPercentage } from "../steps/step4/quartileFormHelpers";
import type { PayGapRow, QuartileData } from "../types";
import { GAP_FAVORED_SEX_MENTIONS } from "./gapBadge";
import { PAY_GAP_LABELS } from "./indicatorRowMapping";

const [ANNUAL_MEAN_LABEL] = PAY_GAP_LABELS;

function gapReadingNote(rows: PayGapRow[], subject: string): string | null {
	const row = rows.find((r) => r.label === ANNUAL_MEAN_LABEL);
	if (!row) return null;
	const gap = resolveGap(row.womenValue, row.menValue, row.gipReference);
	if (gap === null) return null;
	const favoredSex = gapFavoredSex(gap);
	const mention = favoredSex ? ` ${GAP_FAVORED_SEX_MENTIONS[favoredSex]}` : "";
	return `Note de lecture : L'écart de ${subject} est de ${formatGap(gapMagnitude(gap))}${mention}.`;
}

/** Reading note for the step 2 "Rémunération" table, from its "Annuelle brute moyenne" row. */
export function payGapReadingNote(rows: PayGapRow[]): string | null {
	return gapReadingNote(rows, "rémunération annuelle brute moyenne");
}

/** Reading note for the step 3 variable-pay gap table, from its "Annuelle brute moyenne" row. */
export function variablePayGapReadingNote(rows: PayGapRow[]): string | null {
	return gapReadingNote(
		rows,
		"rémunération variable ou complémentaire brute moyenne",
	);
}

/** Reading note for the step 3 beneficiaries table. */
export function beneficiariesReadingNote(
	beneficiaryWomen: string,
	maxWomen: number | undefined,
): string | null {
	if (variablePayProportion(beneficiaryWomen, maxWomen) === null) return null;
	const proportion = formatVariablePayProportion(beneficiaryWomen, maxWomen);
	return `Note de lecture : Parmi les femmes, ${proportion} ont bénéficié de composantes variables ou complémentaires.`;
}

function quartileReadingNote(
	firstQuartile: QuartileData | undefined,
	basis: string,
): string | null {
	if (!firstQuartile?.threshold) return null;
	const total = (firstQuartile.women ?? 0) + (firstQuartile.men ?? 0);
	if (total === 0) return null;
	const threshold = formatCurrencyFixedTwo(firstQuartile.threshold);
	const womenPct = quartileGenderPercentage(firstQuartile, "women");
	const menPct = quartileGenderPercentage(firstQuartile, "men");
	return `Note de lecture : ${womenPct} des femmes du premier quartile ont perçu une rémunération ${basis} brute moyenne inférieure à ${threshold} contre ${menPct} d'hommes.`;
}

/** Reading note for the step 4 annual quartile table, from its 1st quartile row. */
export function annualQuartileReadingNote(
	firstQuartile: QuartileData | undefined,
): string | null {
	return quartileReadingNote(firstQuartile, "annuelle");
}

/** Reading note for the step 4 hourly quartile table, from its 1st quartile row. */
export function hourlyQuartileReadingNote(
	firstQuartile: QuartileData | undefined,
): string | null {
	return quartileReadingNote(firstQuartile, "horaire");
}

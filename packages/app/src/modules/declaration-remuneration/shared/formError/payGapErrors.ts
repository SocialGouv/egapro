import type {
	PayGapField,
	PayGapRow,
} from "~/modules/declaration-remuneration/types";
import type { FieldError } from "./types";

const FIELD_SUFFIX: Record<PayGapField, string> = {
	womenValue: "f",
	menValue: "h",
};

const FIELD_SEX_LABEL: Record<PayGapField, string> = {
	womenValue: "les femmes",
	menValue: "les hommes",
};

export function payGapFieldId(
	prefix: string,
	index: number,
	field: PayGapField,
): string {
	return `${prefix}-row${index + 1}-${FIELD_SUFFIX[field]}`;
}

/** Empty amounts of a pay-gap table, named the way the maquette words them. */
export function derivePayGapErrors(
	prefix: string,
	rows: readonly PayGapRow[],
): FieldError[] {
	const errors: FieldError[] = [];
	rows.forEach((row, index) => {
		for (const field of ["womenValue", "menValue"] as const) {
			if (row[field] !== "") continue;
			errors.push({
				fieldId: payGapFieldId(prefix, index, field),
				category: "empty",
				message: `Renseignez le montant ${row.label} pour ${FIELD_SEX_LABEL[field]}.`,
			});
		}
	});
	return errors;
}

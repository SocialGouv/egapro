import type { FieldErrors } from "react-hook-form";
import type { FieldError } from "~/modules/declaration-remuneration/shared/formError/types";
import type { Step1Data } from "~/modules/declaration-remuneration/types";
import type { WorkforceField } from "./workforceRows";
import {
	WORKFORCE_ROWS,
	workforceFieldErrorMessage,
	workforceFieldId,
} from "./workforceRows";

export type RawValues = Record<WorkforceField, string>;

export function getMissingFieldErrors(raw: RawValues): FieldError[] {
	const missing: FieldError[] = [];
	for (const row of WORKFORCE_ROWS) {
		for (const sex of ["women", "men"] as const) {
			const field = sex === "women" ? row.womenField : row.menField;
			if (raw[field] === "") {
				missing.push({
					fieldId: workforceFieldId(row, sex),
					category: "empty",
					message: workforceFieldErrorMessage(row, sex),
				});
			}
		}
	}
	return missing;
}

export function getInvalidRowErrors(
	raw: RawValues,
	errors: FieldErrors<Step1Data>,
): FieldError[] {
	return WORKFORCE_ROWS.flatMap((row) => {
		const message =
			errors[row.womenField]?.message ?? errors[row.menField]?.message;
		if (!message || raw[row.womenField] === "" || raw[row.menField] === "") {
			return [];
		}
		return (["women", "men"] as const).map((sex) => ({
			fieldId: workforceFieldId(row, sex),
			category: "workforce" as const,
			message,
		}));
	});
}

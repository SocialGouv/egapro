/**
 * One offending field of a declaration form. The category drives the alert
 * title, the message names the field in full — the input itself only carries
 * the error state, never the text (#4235).
 */
export type FieldErrorCategory = "empty" | "invalid" | "inconsistent";

export type FieldError = {
	/** DOM id of the offending input, used for `aria-describedby` and anchoring. */
	fieldId: string;
	category: FieldErrorCategory;
	message: string;
	/** When true the message is rendered as a link to `fieldId`. */
	anchor?: boolean;
};

export const FIELD_ERROR_TITLES: Record<FieldErrorCategory, string> = {
	empty: "Champ vide",
	invalid: "Valeur invalide",
	inconsistent: "Données incohérentes",
};

/** Id of the alert paragraph an offending input must point at. */
export function fieldErrorAlertId(
	alertId: string,
	category: FieldErrorCategory,
): string {
	return `${alertId}-${category}`;
}

export function findFieldError(
	errors: readonly FieldError[],
	fieldId: string,
): FieldError | undefined {
	return errors.find((error) => error.fieldId === fieldId);
}

export function describedByForField(
	alertId: string,
	error: FieldError | undefined,
): string | undefined {
	return error ? fieldErrorAlertId(alertId, error.category) : undefined;
}

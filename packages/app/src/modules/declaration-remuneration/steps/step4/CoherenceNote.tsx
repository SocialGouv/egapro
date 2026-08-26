import { FieldErrorAlert } from "../../shared/formError/FieldErrorAlert";
import type { FieldError } from "../../shared/formError/types";
import { type CoherenceError, coherenceErrorLabel } from "./quartileCoherence";
import type { TableType } from "./quartileErrors";

type Props = {
	tableType: TableType;
	errors: CoherenceError[];
	focusOnValidation: boolean;
	validationAttempt: number;
};

export function CoherenceNote({
	tableType,
	errors,
	focusOnValidation,
	validationAttempt,
}: Props) {
	const tableErrors: FieldError[] = errors
		.filter((error) => error.table === tableType)
		.map((error) => ({
			fieldId: `step4-${tableType}-${error.field}-coherence`,
			category: "inconsistent",
			message: coherenceErrorLabel(error),
		}));
	return (
		<FieldErrorAlert
			errors={tableErrors}
			focusOnValidation={focusOnValidation}
			id={`step4-coherence-${tableType}`}
			validationAttempt={validationAttempt}
		/>
	);
}

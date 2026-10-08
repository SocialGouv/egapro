import type { FieldErrors, UseFormRegister } from "react-hook-form";

import {
	type DeadlineGroup,
	FIELD_HINTS,
	FIELD_LABELS,
} from "./remunerationDeadlineGroups";
import { SettingsDateField, SettingsReadOnlyField } from "./SettingsFields";
import type { RemunerationDeadlinesFormValues } from "./schemas";

type Props = {
	group: DeadlineGroup;
	pathChoiceValue: string;
	errors: FieldErrors<RemunerationDeadlinesFormValues>;
	register: UseFormRegister<RemunerationDeadlinesFormValues>;
};

export function DeadlineFieldset({
	group,
	pathChoiceValue,
	errors,
	register,
}: Props) {
	return (
		<fieldset className="fr-fieldset">
			<legend className="fr-fieldset__legend">{group.legend}</legend>
			<div className="fr-fieldset__content fr-grid-row fr-grid-row--gutters">
				{group.pathChoiceKey && (
					<div className="fr-col-12 fr-col-md-4">
						<SettingsReadOnlyField
							hint="Calculée — non paramétrable"
							id={`settings-${group.pathChoiceKey}`}
							label="Échéance de choix du parcours"
							type="date"
							value={pathChoiceValue}
						/>
					</div>
				)}
				{group.fields.map((key) => (
					<div className="fr-col-12 fr-col-md-4" key={key}>
						<SettingsDateField
							error={errors[key]?.message}
							hint={FIELD_HINTS[key]}
							id={`settings-${key}`}
							label={FIELD_LABELS[key]}
							registration={register(key)}
							required
						/>
					</div>
				))}
			</div>
		</fieldset>
	);
}

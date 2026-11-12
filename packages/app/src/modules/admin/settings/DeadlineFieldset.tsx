import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { formatIsoDate } from "~/modules/domain";

import { type DeadlineGroup, FIELD_LABELS } from "./remunerationDeadlineGroups";
import { SettingsDateField, SettingsReadOnlyField } from "./SettingsFields";
import type { RemunerationDeadlinesFormValues } from "./schemas";

type Props = {
	group: DeadlineGroup;
	gipPublicationDate: string | null;
	requiredNoteId: string;
	errors: FieldErrors<RemunerationDeadlinesFormValues>;
	register: UseFormRegister<RemunerationDeadlinesFormValues>;
};

export function DeadlineFieldset({
	group,
	gipPublicationDate,
	requiredNoteId,
	errors,
	register,
}: Props) {
	return (
		<fieldset className="fr-fieldset">
			<legend className="fr-fieldset__legend">{group.legend}</legend>
			<div className="fr-fieldset__content fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
				{group.showsGipPublicationDate && (
					<div className="fr-col-12 fr-col-md-4">
						<SettingsReadOnlyField
							hint="Lecture seule. Date issue du fichier GIP récupéré depuis SUIT."
							id="settings-gipPublicationDate"
							label="Date de mise à disposition des données GIP"
							type="text"
							value={
								gipPublicationDate
									? formatIsoDate(gipPublicationDate)
									: "Non disponible"
							}
						/>
					</div>
				)}
				{group.fields.map((key) => (
					<div className="fr-col-12 fr-col-md-4" key={key}>
						<SettingsDateField
							error={errors[key]?.message}
							id={`settings-${key}`}
							label={FIELD_LABELS[key]}
							registration={register(key)}
							required
							requiredNoteId={requiredNoteId}
						/>
					</div>
				))}
			</div>
		</fieldset>
	);
}

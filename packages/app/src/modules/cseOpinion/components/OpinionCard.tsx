import type { FieldError } from "~/modules/declaration-remuneration/shared/formError/types";
import { describedByForField } from "~/modules/declaration-remuneration/shared/formError/types";
import { opinionDateId, opinionRadioId } from "../opinionFieldErrors";
import type { OpinionType } from "../types";
import styles from "./OpinionCard.module.scss";

type Props = {
	id: string;
	title: string;
	opinion: OpinionType | null;
	date: string;
	onOpinionChange: (value: OpinionType) => void;
	onDateChange: (value: string) => void;
	readOnly?: boolean;
	errorAlertId: string;
	requiredNoteId: string;
	opinionError?: FieldError;
	dateError?: FieldError;
};

export function OpinionCard({
	id,
	title,
	opinion,
	date,
	onOpinionChange,
	onDateChange,
	readOnly = false,
	errorAlertId,
	requiredNoteId,
	opinionError,
	dateError,
}: Props) {
	const legendId = `${id}-legend`;
	const dateId = opinionDateId(id);
	const favorableId = opinionRadioId(id, "favorable");
	const unfavorableId = opinionRadioId(id, "unfavorable");
	const opinionDescribedBy = describedByForField(
		errorAlertId,
		opinionError,
		requiredNoteId,
	);
	const opinionInvalid = opinionError ? true : undefined;
	const dateInvalid = dateError ? true : undefined;
	const fieldsetClass = opinionError
		? "fr-fieldset fr-fieldset--error"
		: "fr-fieldset";
	const dateGroupClass = dateError
		? "fr-input-group fr-input-group--error"
		: "fr-input-group";
	const dateInputClass = dateError ? "fr-input fr-input--error" : "fr-input";

	return (
		<div className={styles.card}>
			<p className="fr-text--bold fr-mb-3w" id={legendId}>
				{title}
			</p>

			<fieldset aria-labelledby={legendId} className={fieldsetClass}>
				<legend
					className="fr-fieldset__legend--regular fr-fieldset__legend"
					id={`${id}-opinion-legend`}
				>
					Quel est l'avis du CSE ?
				</legend>
				<div className="fr-fieldset__element fr-fieldset__element--inline">
					<div className="fr-radio-group fr-radio-rich">
						<input
							aria-describedby={opinionDescribedBy}
							aria-invalid={opinionInvalid}
							checked={opinion === "favorable"}
							disabled={readOnly}
							id={favorableId}
							name={`${id}-opinion`}
							onChange={() => onOpinionChange("favorable")}
							required
							type="radio"
							value="favorable"
						/>
						<label className="fr-label" htmlFor={favorableId}>
							Favorable
						</label>
					</div>
				</div>
				<div className="fr-fieldset__element fr-fieldset__element--inline">
					<div className="fr-radio-group fr-radio-rich">
						<input
							aria-describedby={opinionDescribedBy}
							aria-invalid={opinionInvalid}
							checked={opinion === "unfavorable"}
							disabled={readOnly}
							id={unfavorableId}
							name={`${id}-opinion`}
							onChange={() => onOpinionChange("unfavorable")}
							required
							type="radio"
							value="unfavorable"
						/>
						<label className="fr-label" htmlFor={unfavorableId}>
							Défavorable
						</label>
					</div>
				</div>
				<div
					aria-live="polite"
					className="fr-messages-group"
					id={`${id}-messages`}
				/>
			</fieldset>

			<div className={`${dateGroupClass} fr-mt-3w fr-col-12 fr-col-md-4`}>
				<label className="fr-label" htmlFor={dateId}>
					Date de l'avis rendu par le CSE
					<span className="fr-hint-text">Format attendu : JJ/MM/AAAA</span>
				</label>
				<input
					aria-describedby={describedByForField(
						errorAlertId,
						dateError,
						requiredNoteId,
					)}
					aria-invalid={dateInvalid}
					className={dateInputClass}
					id={dateId}
					onChange={(e) => onDateChange(e.target.value)}
					placeholder="Sélectionner une date"
					readOnly={readOnly}
					type="date"
					value={date}
				/>
			</div>
		</div>
	);
}

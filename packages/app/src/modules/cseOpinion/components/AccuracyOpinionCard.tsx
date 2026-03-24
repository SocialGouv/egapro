import type { OpinionType } from "../types";
import styles from "./OpinionCard.module.scss";

type Props = {
	id: string;
	title: string;
	opinion: OpinionType | null;
	date: string;
	onOpinionChange: (value: OpinionType) => void;
	onDateChange: (value: string) => void;
};

export function AccuracyOpinionCard({
	id,
	title,
	opinion,
	date,
	onOpinionChange,
	onDateChange,
}: Props) {
	const legendId = `${id}-legend`;
	const dateId = `${id}-date`;

	return (
		<div className={styles.card}>
			<p className="fr-text--bold fr-mb-3w" id={legendId}>
				{title}
			</p>

			<fieldset aria-labelledby={legendId} className="fr-fieldset">
				<legend
					className="fr-fieldset__legend--regular fr-fieldset__legend"
					id={`${id}-opinion-legend`}
				>
					Quel est l'avis du CSE ?
				</legend>
				<div className="fr-fieldset__element fr-fieldset__element--inline">
					<div className="fr-radio-group fr-radio-rich">
						<input
							checked={opinion === "favorable"}
							id={`${id}-favorable`}
							name={`${id}-opinion`}
							onChange={() => onOpinionChange("favorable")}
							type="radio"
							value="favorable"
						/>
						<label className="fr-label" htmlFor={`${id}-favorable`}>
							Favorable
						</label>
					</div>
				</div>
				<div className="fr-fieldset__element fr-fieldset__element--inline">
					<div className="fr-radio-group fr-radio-rich">
						<input
							checked={opinion === "unfavorable"}
							id={`${id}-unfavorable`}
							name={`${id}-opinion`}
							onChange={() => onOpinionChange("unfavorable")}
							type="radio"
							value="unfavorable"
						/>
						<label className="fr-label" htmlFor={`${id}-unfavorable`}>
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

			<div className="fr-input-group fr-mt-3w fr-col-12 fr-col-md-4">
				<label className="fr-label" htmlFor={dateId}>
					Date de l'avis rendu par le CSE
					<span className="fr-hint-text">Format attendu : JJ/MM/AAAA</span>
				</label>
				<input
					className="fr-input"
					id={dateId}
					onChange={(e) => onDateChange(e.target.value)}
					placeholder="Sélectionner une date"
					type="date"
					value={date}
				/>
			</div>
		</div>
	);
}

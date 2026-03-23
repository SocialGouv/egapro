import type { OpinionType } from "../types";
import styles from "./OpinionCard.module.scss";

type Props = {
	id: string;
	consulted: boolean | null;
	opinion: OpinionType | null;
	date: string;
	onConsultedChange: (value: boolean) => void;
	onOpinionChange: (value: OpinionType) => void;
	onDateChange: (value: string) => void;
};

export function GapConsultationCard({
	id,
	consulted,
	opinion,
	date,
	onConsultedChange,
	onOpinionChange,
	onDateChange,
}: Props) {
	const legendId = `${id}-legend`;
	const opinionLegendId = `${id}-opinion-legend`;
	const dateId = `${id}-date`;

	return (
		<div className={styles.card}>
			<p className="fr-text--bold fr-mb-3w" id={legendId}>
				Justification des écarts &ge; 5 % par des critères objectifs et non
				sexistes de l'indicateur de rémunération par catégorie de salariés
			</p>

			<fieldset aria-labelledby={legendId} className="fr-fieldset">
				<legend
					className="fr-fieldset__legend--regular fr-fieldset__legend"
					id={`${id}-question-legend`}
				>
					Avez-vous informé et consulté le CSE sur la justification des écarts
					&ge; 5 % ?
				</legend>
				<div className="fr-fieldset__element fr-fieldset__element--inline">
					<div className="fr-radio-group fr-radio-rich">
						<input
							checked={consulted === true}
							id={`${id}-yes`}
							name={`${id}-consulted`}
							onChange={() => onConsultedChange(true)}
							type="radio"
							value="yes"
						/>
						<label className="fr-label" htmlFor={`${id}-yes`}>
							Oui
						</label>
					</div>
				</div>
				<div className="fr-fieldset__element fr-fieldset__element--inline">
					<div className="fr-radio-group fr-radio-rich">
						<input
							checked={consulted === false}
							id={`${id}-no`}
							name={`${id}-consulted`}
							onChange={() => onConsultedChange(false)}
							type="radio"
							value="no"
						/>
						<label className="fr-label" htmlFor={`${id}-no`}>
							Non
						</label>
					</div>
				</div>
				<div
					aria-live="polite"
					className="fr-messages-group"
					id={`${id}-messages`}
				/>
			</fieldset>

			{consulted && (
				<>
					<fieldset className="fr-fieldset fr-mt-3w">
						<legend
							className="fr-fieldset__legend--regular fr-fieldset__legend"
							id={opinionLegendId}
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
				</>
			)}
		</div>
	);
}

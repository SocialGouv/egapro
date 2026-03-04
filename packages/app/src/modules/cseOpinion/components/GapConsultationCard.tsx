type Props = {
	id: string;
	consulted: boolean | null;
	onConsultedChange: (value: boolean) => void;
};

export function GapConsultationCard({
	id,
	consulted,
	onConsultedChange,
}: Props) {
	const legendId = `${id}-legend`;

	return (
		<div className="fr-p-2w fr-border fr-border-radius--4">
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
		</div>
	);
}

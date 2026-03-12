import { TooltipButton } from "~/modules/declaration-remuneration/shared/TooltipButton";

type Props = {
	startDate: string;
	endDate: string;
	onStartDateChange: (value: string) => void;
	onEndDateChange: (value: string) => void;
};

export function ReferencePeriodPicker({
	startDate,
	endDate,
	onStartDateChange,
	onEndDateChange,
}: Props) {
	return (
		<div>
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-2w">
				<div className="fr-col-auto">
					<p className="fr-mb-0 fr-text--medium">
						Quelle est la période de référence pour le calcul de
						l&apos;indicateur ?
					</p>
				</div>
				<div className="fr-col-auto">
					<TooltipButton
						id="tooltip-second-decl-period"
						label="Informations sur la période prise en compte pour la seconde déclaration"
					/>
				</div>
			</div>
			<div className="fr-grid-row fr-grid-row--gutters">
				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-input-group">
						<label className="fr-label" htmlFor="period-start-date">
							Date de début
							<span className="fr-hint-text">Format attendu : JJ/MM/AAAA</span>
						</label>
						<input
							className="fr-input"
							id="period-start-date"
							onChange={(e) => onStartDateChange(e.target.value)}
							type="date"
							value={startDate}
						/>
					</div>
				</div>
				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-input-group">
						<label className="fr-label" htmlFor="period-end-date">
							Date de fin
							<span className="fr-hint-text">Format attendu : JJ/MM/AAAA</span>
						</label>
						<input
							className="fr-input"
							id="period-end-date"
							onChange={(e) => onEndDateChange(e.target.value)}
							type="date"
							value={endDate}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

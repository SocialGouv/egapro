import { TooltipButton } from "~/modules/declaration-remuneration/shared/TooltipButton";
import styles from "./ReferencePeriodPicker.module.scss";

type Props = {
	startDate: string;
	endDate: string;
	onStartDateChange: (value: string) => void;
	onEndDateChange: (value: string) => void;
	disabled?: boolean;
};

export function ReferencePeriodPicker({
	startDate,
	endDate,
	onStartDateChange,
	onEndDateChange,
	disabled = false,
}: Props) {
	return (
		<fieldset className={styles.fieldset}>
			<legend className={`fr-mb-2w ${styles.legend}`}>
				<span>
					Quelle est la période de référence pour le calcul de l&apos;indicateur
					?
				</span>
				<TooltipButton
					id="tooltip-second-decl-period"
					label="Informations sur la période prise en compte pour la seconde déclaration"
				/>
			</legend>
			<div className="fr-grid-row fr-grid-row--gutters">
				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-input-group">
						<label className="fr-label" htmlFor="period-start-date">
							Date de début
							<span className="fr-hint-text">Format attendu : JJ/MM/AAAA</span>
						</label>
						<input
							className="fr-input"
							disabled={disabled}
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
							disabled={disabled}
							id="period-end-date"
							onChange={(e) => onEndDateChange(e.target.value)}
							type="date"
							value={endDate}
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

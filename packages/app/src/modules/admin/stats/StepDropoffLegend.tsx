import {
	DROPOFF_RATE_ALERT_THRESHOLD,
	formatWholePercentage,
} from "~/modules/domain";
import {
	DROPOFF_ALERT_MARK,
	DROPOFF_BAR_TONES,
	PHASE_LABELS,
} from "./constants";
import styles from "./StepDropoffChart.module.scss";

export function StepDropoffLegend() {
	const threshold = formatWholePercentage(DROPOFF_RATE_ALERT_THRESHOLD);

	return (
		<div className="fr-mt-2w">
			<p className="fr-text--sm fr-text--bold fr-mb-1v">Légende</p>
			<ul className={`fr-raw-list fr-text--sm fr-mb-0 ${styles.legendList}`}>
				<li className={styles.legendItem}>
					<span
						aria-hidden="true"
						className={`${styles.legendSwatch} ${DROPOFF_BAR_TONES.wizard.normal.swatchClass}`}
					/>
					{PHASE_LABELS.wizard}
				</li>
				<li className={styles.legendItem}>
					<span
						aria-hidden="true"
						className={`${styles.legendSwatch} ${DROPOFF_BAR_TONES.post_submit.normal.swatchClass}`}
					/>
					{PHASE_LABELS.post_submit}
				</li>
				<li className={styles.legendItem}>
					<span
						aria-hidden="true"
						className={`${styles.legendSwatch} ${DROPOFF_BAR_TONES.wizard.alert.swatchClass}`}
					/>
					<span
						aria-hidden="true"
						className={`${styles.legendSwatch} ${DROPOFF_BAR_TONES.post_submit.alert.swatchClass}`}
					/>
					Barre rouge et symbole « {DROPOFF_ALERT_MARK} » devant la valeur :
					taux d'abandon supérieur au seuil de {threshold}
				</li>
			</ul>
		</div>
	);
}

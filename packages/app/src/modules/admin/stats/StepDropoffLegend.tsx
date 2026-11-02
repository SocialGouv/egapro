import {
	DROPOFF_RATE_ALERT_THRESHOLD,
	formatWholePercentage,
} from "~/modules/domain";
import { DROPOFF_ALERT_MARK } from "./constants";
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
						className={`${styles.legendSwatch} ${styles.legendSwatchWizard}`}
					/>
					Étape du parcours initial (wizard A–F)
				</li>
				<li className={styles.legendItem}>
					<span
						aria-hidden="true"
						className={`${styles.legendSwatch} ${styles.legendSwatchPostSubmit}`}
					/>
					Phase post-transmission
				</li>
				<li className={styles.legendItem}>
					<span
						aria-hidden="true"
						className={`${styles.legendSwatch} ${styles.legendSwatchWizardAlert}`}
					/>
					<span
						aria-hidden="true"
						className={`${styles.legendSwatch} ${styles.legendSwatchPostSubmitAlert}`}
					/>
					Barre rouge et symbole « {DROPOFF_ALERT_MARK} » devant la valeur :
					taux d'abandon supérieur au seuil de {threshold}
				</li>
			</ul>
		</div>
	);
}

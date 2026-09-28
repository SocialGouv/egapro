import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import styles from "./Step5Review.module.scss";

const TELEACCORDS_URL = "https://www.teleaccords.travail.gouv.fr";

export function Step5NextSteps({ summary }: { summary: string }) {
	return (
		<section className={styles.nextSteps}>
			<h2 className="fr-h6 fr-mb-0">Prochaines étapes</h2>
			<div className={styles.badgeRow}>
				<p className="fr-badge fr-badge--sm fr-badge--warning">
					Écarts détectés
				</p>
			</div>
			<p className="fr-mb-0">
				{summary} Vous devez définir des mesures adéquates et pertinentes de
				correction, par l&apos;un des deux moyens suivants&nbsp;:
			</p>
			<ul className="fr-mb-0">
				<li>
					<strong>
						Par accord collectif, dans le cadre de la négociation obligatoire
						sur l&apos;égalité professionnelle
					</strong>
				</li>
				<li>
					<strong>
						Par décision unilatérale de l&apos;employeur après information -
						consultation du CSE
					</strong>
				</li>
			</ul>
			<p className="fr-mb-0">
				Les documents doivent être déposés sur{" "}
				<a
					className="fr-link"
					href={TELEACCORDS_URL}
					rel="noopener noreferrer"
					target="_blank"
				>
					TéléAccords
					<NewTabNotice />
				</a>
			</p>
		</section>
	);
}

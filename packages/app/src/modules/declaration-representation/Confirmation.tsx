import Link from "next/link";

import { DsfrPictogram } from "~/modules/layout";
import styles from "./Confirmation.module.scss";

type ConfirmationProps = {
	campaignYear: number;
	email: string | null;
	referenceYear: number;
};

export function Confirmation({
	campaignYear,
	email,
	referenceYear,
}: ConfirmationProps) {
	return (
		<div className={styles.confirmation}>
			<h1 className="fr-h4 fr-mb-0">
				Démarche des indicateurs de représentation {campaignYear}
			</h1>

			<div className={styles.successRow}>
				<DsfrPictogram
					className="fr-artwork--green-emeraude"
					path="/dsfr/artwork/pictograms/system/success.svg"
					size={64}
				/>
				<p className="fr-text--lead fr-text--bold fr-mb-0">
					Votre parcours {campaignYear} est désormais terminé
				</p>
			</div>

			<div className={styles.block}>
				<p className="fr-text--sm fr-mb-0">
					Un accusé de réception a été envoyé à l&apos;adresse e-mail{" "}
					<strong>{email ?? "renseignée sur votre compte"}</strong>.
				</p>
				<p className={`fr-text--sm fr-mb-0 ${styles.mention}`}>
					Si ce n&apos;est pas le cas, vérifiez vos courriers indésirables ou
					SPAM. Sinon, cliquez sur le bouton ci-dessous.
				</p>
				<button
					aria-disabled="true"
					className="fr-btn fr-btn--tertiary fr-btn--sm"
					disabled
					type="button"
				>
					Renvoyer l&apos;accusé de réception
				</button>
			</div>

			<div className={styles.block}>
				<h2 className="fr-h6 fr-mb-0">
					Télécharger le récapitulatif de la déclaration
				</h2>
				<p className="fr-text--sm fr-mb-0">
					Année {campaignYear} au titre des données {referenceYear}
				</p>
				<button
					aria-disabled="true"
					className="fr-btn fr-btn--secondary"
					disabled
					type="button"
				>
					Télécharger le récapitulatif (PDF)
				</button>
			</div>

			<div>
				<Link className="fr-btn" href="/mon-espace">
					Mon espace
				</Link>
			</div>
		</div>
	);
}

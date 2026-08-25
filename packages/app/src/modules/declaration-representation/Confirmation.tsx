import Link from "next/link";

import { DsfrPictogram } from "~/modules/layout";
import { ResendReceiptButton } from "~/modules/mail";
import { DownloadCard } from "~/modules/shared/DownloadCard";
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
				<ResendReceiptButton kind="representation" year={referenceYear} />
			</div>

			{/* Visually hidden: bridges h1 → h3 (DownloadCard's own title) without adding a visible heading the Figma frame doesn't show. */}
			<h2 className="fr-sr-only">Documents récapitulatifs de votre démarche</h2>
			<DownloadCard
				dataYear={referenceYear}
				href={`/api/representation-pdf?year=${referenceYear}`}
				title="Télécharger le récapitulatif de la déclaration"
				year={campaignYear}
			/>

			<div>
				<Link className="fr-btn" href="/mon-espace">
					Mon espace
				</Link>
			</div>
		</div>
	);
}

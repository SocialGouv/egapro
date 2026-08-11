import Link from "next/link";
import { DsfrPictogram } from "~/modules/layout";
import { ResendReceiptButton } from "~/modules/mail";
import { FeedbackBanner } from "~/modules/shared/FeedbackBanner";
import styles from "./ConfirmationPage.module.scss";
import { DownloadCard } from "./DownloadCard";
import formStyles from "./shared/formActions.module.scss";

type Props = {
	dataYear: number;
	declarationYear: number;
	email?: string;
	hasSecondDeclaration?: boolean;
};

export function ConfirmationPage({
	dataYear,
	declarationYear,
	email,
	hasSecondDeclaration = false,
}: Props) {
	const displayEmail = email ?? "adresse@exemple.fr";
	return (
		<div>
			<h1 className="fr-h4 fr-mb-4w">
				Démarche des indicateurs de rémunération {declarationYear}
			</h1>
			<div className={`fr-mb-4w ${styles.successRow}`}>
				<DsfrPictogram
					className="fr-artwork--green-emeraude"
					path="/dsfr/artwork/pictograms/system/success.svg"
					size={64}
				/>
				<p className="fr-text--lg fr-text--bold fr-mb-0">
					Votre parcours {declarationYear} est désormais terminé
				</p>
			</div>
			<div className={styles.receiptCard}>
				<p className="fr-text--sm fr-mb-1w">
					Un accusé de réception a été envoyé à l&apos;adresse e-mail{" "}
					<strong>{displayEmail}</strong>.
				</p>
				<p className="fr-text--sm fr-text--mention-grey fr-mb-2w">
					Si ce n&apos;est pas le cas, vérifiez vos courriers indésirables ou
					SPAM. Sinon, cliquez sur le bouton ci-dessous.
				</p>
				<ResendReceiptButton kind="cseOpinion" year={declarationYear} />
			</div>

			<h2 className="fr-h5 fr-mb-3w">
				Documents récapitulatifs de votre déclaration
			</h2>

			<div className={`fr-mb-4w ${styles.downloadCards}`}>
				<DownloadCard
					dataYear={dataYear}
					href={`/api/declaration-pdf?year=${declarationYear}`}
					title="Télécharger le récapitulatif de la déclaration des indicateurs"
					year={declarationYear}
				/>
				{hasSecondDeclaration && (
					<DownloadCard
						dataYear={dataYear}
						href={`/api/declaration-pdf?type=correction&year=${declarationYear}`}
						title="Télécharger le récapitulatif de la seconde déclaration de l'indicateur par catégorie de salariés"
						year={declarationYear}
					/>
				)}
				<DownloadCard
					dataYear={dataYear}
					href={`/api/transmitted-pdf?year=${declarationYear}`}
					title="Télécharger le récapitulatif des éléments transmis"
					year={declarationYear}
				/>
			</div>

			<FeedbackBanner className="fr-mb-4w" />
			<div className={formStyles.actionsEnd}>
				<Link className="fr-btn" href="/mon-espace">
					Mon espace
				</Link>
			</div>
		</div>
	);
}

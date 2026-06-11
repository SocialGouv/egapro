import { formatLongDate } from "~/modules/domain";
import { DsfrPictogram } from "~/modules/layout/shared/DsfrPictogram";
import { ResendReceiptButton } from "~/modules/mail";
import styles from "./DeclarationSuccessBanner.module.scss";

type Props = {
	email: string;
	isSecondDeclaration?: boolean;
	modificationDeadline: Date;
	pdfDownloadHref?: string;
	year: number;
};

export function DeclarationSuccessBanner({
	email,
	isSecondDeclaration = false,
	modificationDeadline,
	pdfDownloadHref,
	year,
}: Props) {
	return (
		<div className="fr-grid-row fr-grid-row--gutters fr-p-4w fr-background-alt--blue-france">
			<div className="fr-col-12 fr-col-md-6">
				<div className={styles.content}>
					<div className={styles.titleRow}>
						<DsfrPictogram
							className="fr-artwork--green-emeraude"
							path="/dsfr/artwork/pictograms/system/success.svg"
							size={44}
						/>
						<p className="fr-text--bold fr-text--lg fr-mb-0">
							{isSecondDeclaration
								? "Votre seconde déclaration a été transmise"
								: "Votre déclaration a été transmise"}
						</p>
					</div>
					<p className="fr-mb-0">
						Vous pouvez modifier votre déclaration jusqu'au{" "}
						<strong>{formatLongDate(modificationDeadline)}</strong>
					</p>
					{pdfDownloadHref && (
						<a
							className="fr-link fr-link--download"
							download
							href={pdfDownloadHref}
						>
							{isSecondDeclaration
								? "Télécharger le récapitulatif de la seconde déclaration de l'indicateur de rémunération par catégorie de salariés"
								: "Télécharger le récapitulatif de la déclaration des indicateurs"}
							<span className="fr-link__detail">PDF</span>
						</a>
					)}
				</div>
			</div>
			<div className="fr-col-12 fr-col-md-6">
				<div className="fr-p-2w fr-border fr-background-default--grey">
					<p className="fr-text--sm fr-mb-1w">
						Un accusé de réception a été envoyé à l'adresse e-mail{" "}
						<strong>{email}</strong>.
					</p>
					<p className="fr-text--sm fr-text--mention-grey fr-mb-2w">
						Si ce n'est pas le cas, vérifiez vos courriers indésirables ou SPAM.
						Sinon, cliquez sur le bouton ci-dessous.
					</p>
					<ResendReceiptButton
						kind={isSecondDeclaration ? "secondDeclaration" : "declaration"}
						year={year}
					/>
				</div>
			</div>
		</div>
	);
}

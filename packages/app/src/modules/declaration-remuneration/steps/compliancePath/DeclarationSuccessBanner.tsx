import { formatLongDate } from "~/modules/domain";
import { DsfrPictogram } from "~/modules/layout/shared/DsfrPictogram";
import { ResendReceiptButton } from "~/modules/mail";
import { FileDownloadLink } from "~/modules/shared";
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
		<div className={`fr-p-4w fr-background-alt--blue-france ${styles.wrapper}`}>
			<div className={styles.column}>
				<div className={styles.content}>
					<div className={styles.titleRow}>
						<DsfrPictogram
							className="fr-artwork--green-emeraude"
							path="/dsfr/artwork/pictograms/system/success.svg"
							size={44}
						/>
						<p className="fr-text--bold fr-text--lg fr-text-title--grey fr-mb-0">
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
						<FileDownloadLink
							className="fr-link fr-link--download"
							href={pdfDownloadHref}
							pendingLabel="Génération du récapitulatif en cours…"
						>
							{isSecondDeclaration
								? "Télécharger le récapitulatif de la seconde déclaration de l'indicateur de rémunération par catégorie de salariés"
								: "Télécharger le récapitulatif de la déclaration des indicateurs"}{" "}
							{/* `fr-link--download` always reserves a band under the label for
							    this detail; without it the link renders a dangling empty line.
							    The PDF is generated on demand, so only the format is known. */}
							<span className="fr-link__detail">PDF</span>
						</FileDownloadLink>
					)}
				</div>
			</div>
			<div className={styles.column}>
				{/* `fr-border` looks like a DSFR utility but does not exist; the real
				    one is `fr-border-default--grey`. */}
				<div className="fr-p-2w fr-border-default--grey fr-background-default--grey">
					<p className="fr-text--sm fr-mb-1w">
						Un accusé de réception a été envoyé à l'adresse e-mail{" "}
						<strong>{email}</strong>.{" "}
						<span className="fr-text-mention--grey">
							Si ce n'est pas le cas, vérifiez vos courriers indésirables ou
							SPAM. Sinon, cliquez sur le bouton ci-dessous.
						</span>
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

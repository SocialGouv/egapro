import { formatCivilLongDate } from "~/modules/domain";
import { DsfrPictogram } from "~/modules/layout/shared/DsfrPictogram";
import { ResendReceiptButton } from "~/modules/mail";
import {
	API_DECLARATION_PDF,
	API_JOINT_EVALUATION_PDF,
} from "~/modules/routes";
import { FileDownloadLink, FileFormatDetail } from "~/modules/shared";
import type { SubmissionBannerVariant } from "../submissionBanner";
import styles from "./SubmissionBanner.module.scss";

const BANNER_CONTENT = {
	joint_evaluation: {
		title: "Votre évaluation conjointe des rémunérations a été transmise",
		recapLabel: (year: number) =>
			`Télécharger le récapitulatif : Évaluation conjointe des rémunérations ${year}`,
		recapHref: (year: number) => `${API_JOINT_EVALUATION_PDF}?year=${year}`,
		receiptKind: "cseOpinion",
	},
	second_declaration: {
		title: "Votre seconde déclaration a été transmise",
		recapLabel: (year: number) =>
			`Télécharger le récapitulatif : Seconde déclaration de l'indicateur par catégorie d'emplois ${year}`,
		recapHref: (year: number) =>
			`${API_DECLARATION_PDF}?type=correction&year=${year}`,
		receiptKind: "secondDeclaration",
	},
} as const;

type Props = {
	variant: SubmissionBannerVariant;
	depositModifiable: boolean;
	email: string;
	deadline: Date;
	year: number;
};

export function SubmissionBanner({
	variant,
	depositModifiable,
	email,
	deadline,
	year,
}: Props) {
	const content = BANNER_CONTENT[variant];
	const recapHref = content.recapHref(year);
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
							{content.title}
						</p>
					</div>
					{depositModifiable ? (
						<p className="fr-mb-0">
							Vous pouvez modifier votre dépôt jusqu'à ce que vous transmettiez
							l'avis ou les avis du CSE.
						</p>
					) : (
						<p className="fr-mb-0">
							Échéance pour transmettre l'avis ou les avis du CSE :{" "}
							<strong>{formatCivilLongDate(deadline)}</strong>
						</p>
					)}
					<div className={styles.download}>
						<FileDownloadLink
							className="fr-link fr-icon-download-line fr-link--icon-right"
							href={recapHref}
							pendingLabel="Génération du récapitulatif en cours…"
						>
							{content.recapLabel(year)}
						</FileDownloadLink>
						<p className="fr-text--xs fr-text-mention--grey fr-mb-0">
							<FileFormatDetail href={recapHref} />
						</p>
					</div>
				</div>
			</div>
			<div className={styles.column}>
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
						kind={content.receiptKind}
						size="sm"
						year={year}
					/>
				</div>
			</div>
		</div>
	);
}

import { formatFrenchDate } from "~/modules/domain";

type Props = {
	email: string;
	isSecondDeclaration?: boolean;
	modificationDeadline: string;
	pdfDownloadHref?: string;
};

export function DeclarationSuccessBanner({
	email,
	isSecondDeclaration = false,
	modificationDeadline,
	pdfDownloadHref,
}: Props) {
	return (
		<div className="fr-grid-row fr-grid-row--gutters fr-p-4w fr-background-alt--blue-france">
			<div className="fr-col-12 fr-col-md-6">
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div className="fr-col-auto">
						<span
							aria-hidden="true"
							className="fr-icon-checkbox-circle-fill fr-icon--lg fr-text-default--success"
						/>
					</div>
					<div className="fr-col">
						<p className="fr-text--bold fr-text--lg fr-mb-1w">
							{isSecondDeclaration
								? "Votre seconde déclaration a été transmise"
								: "Votre déclaration a été transmise"}
						</p>
						<p className="fr-mb-1w">
							Vous pouvez modifier votre déclaration jusqu'au{" "}
							<strong>{formatFrenchDate(modificationDeadline)}</strong>
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
					<button className="fr-btn fr-btn--tertiary fr-btn--sm" type="button">
						Renvoyer l'accusé de réception
					</button>
				</div>
			</div>
		</div>
	);
}

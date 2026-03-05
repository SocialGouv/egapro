import styles from "./SubmissionBanner.module.scss";

type Props = {
	email: string;
	deadline: string;
};

export function SubmissionBanner({ email, deadline }: Props) {
	return (
		<div
			className={`fr-grid-row fr-grid-row--gutters fr-p-4w ${styles.container}`}
		>
			<div className="fr-col-12 fr-col-md-6">
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div className="fr-col-auto">
						<span
							aria-hidden="true"
							className="fr-icon-checkbox-circle-fill fr-icon--lg fr-text-default--success"
						/>
					</div>
					<div className="fr-col">
						<p className="fr-text--bold fr-mb-1w">
							Votre rapport de l'évaluation conjointe a été transmise
						</p>
						<p className="fr-mb-0">
							Vous pouvez modifier votre dépôt jusqu'au{" "}
							<strong>{deadline}</strong>
						</p>
					</div>
				</div>
			</div>
			<div className="fr-col-12 fr-col-md-6">
				<div className={`fr-p-2w fr-border ${styles.receiptCard}`}>
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

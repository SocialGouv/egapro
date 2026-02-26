import styles from "./LoginAccordion.module.scss";

/** Expandable section for users who don't have an account yet. */
export function LoginAccordion() {
	return (
		<section className={`fr-accordion ${styles.accordion}`}>
			<h2 className="fr-accordion__title">
				<button
					aria-controls="accordion-no-account"
					aria-expanded="false"
					className="fr-accordion__btn"
					type="button"
				>
					Vous n'avez pas de compte ?
				</button>
			</h2>
			<div className="fr-collapse" id="accordion-no-account">
				<p>
					Chaque entreprise doit créer son propre compte ProConnect. Les tiers
					déclarants (ex. comptables) ne sont pas autorisés à déclarer pour le
					compte de leurs clients.
				</p>
				<p>
					Si votre entreprise utilise un système de filtrage anti-spam (ex.
					MailInBlack), contactez votre service informatique pour autoriser les
					e-mails envoyés par ProConnect.
				</p>
				<p>Créez un compte en quelques étapes simples :</p>
				<ol>
					<li>
						Confirmez votre adresse email à l'aide du code de validation reçu
					</li>
					<li>Choisissez un mot de passe</li>
					<li>Entrez le SIRET de votre organisation</li>
					<li>Complétez vos informations personnelles</li>
				</ol>
				<p>Votre compte est créé !</p>
			</div>
		</section>
	);
}

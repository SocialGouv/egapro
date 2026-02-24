/** Expandable section for users who don't have an account yet. */
export function LoginAccordion() {
	return (
		<section className="fr-accordion">
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
					ProConnect crée automatiquement votre compte lors de votre première
					connexion à l'aide de votre e-mail professionnel. Aucune inscription
					préalable n'est nécessaire.
				</p>
			</div>
		</section>
	);
}

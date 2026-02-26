import Link from "next/link";

export function MissingSiret() {
	return (
		<main className="fr-container fr-my-4w" id="content">
			<div className="fr-grid-row fr-grid-row--center">
				<div className="fr-col-12 fr-col-md-8">
					<h1>SIRET manquant</h1>
					<div className="fr-alert fr-alert--error">
						<h2 className="fr-alert__title">
							Impossible d'accéder à la déclaration
						</h2>
						<p>
							Votre compte ProConnect ne contient pas de numéro SIRET. Ce numéro
							est nécessaire pour effectuer une déclaration.
						</p>
					</div>
					<div className="fr-mt-4w">
						<p>
							Pour résoudre ce problème, vérifiez que votre organisation est
							bien associée à votre compte ProConnect avec un numéro SIRET
							valide, puis reconnectez-vous.
						</p>
						<Link className="fr-btn" href="/">
							Retour à l'accueil
						</Link>
					</div>
				</div>
			</div>
		</main>
	);
}

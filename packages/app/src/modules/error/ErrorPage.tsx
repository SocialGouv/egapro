import { ErrorArtwork } from "./ErrorArtwork";

/** 500 Internal Server Error page content following DSFR error page template. */
export function ErrorPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container">
				<div className="fr-my-7w fr-mt-md-12w fr-mb-md-10w fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
					<div className="fr-py-0 fr-col-12 fr-col-md-6">
						<h1>Erreur inattendue</h1>
						<p className="fr-text--sm fr-mb-3w">Erreur 500</p>
						<p className="fr-text--sm fr-mb-5w">
							Désolé, le service rencontre un problème, nous travaillons pour le
							résoudre le plus rapidement possible.
						</p>
						<p className="fr-text--lead fr-mb-3w">
							Essayez de rafraîchir la page ou bien réessayez plus tard.
						</p>
					</div>
					<div className="fr-col-12 fr-col-md-3 fr-col-offset-md-1 fr-px-6w fr-px-md-0 fr-py-0">
						<ErrorArtwork />
					</div>
				</div>
			</div>
		</main>
	);
}

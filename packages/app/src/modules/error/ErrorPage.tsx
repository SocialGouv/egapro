import { ErrorLayout } from "./ErrorLayout";

/** 500 Internal Server Error page content following DSFR error page template. */
export function ErrorPage() {
	return (
		<ErrorLayout>
			<h1>Erreur inattendue</h1>
			<p className="fr-text-mention--grey fr-mb-3w">Erreur 500</p>
			<p className="fr-mb-3w">
				Désolé, le service rencontre un problème, nous travaillons pour le
				résoudre le plus rapidement possible.
			</p>
			<p>Essayez de rafraîchir la page ou bien réessayez plus tard.</p>
		</ErrorLayout>
	);
}

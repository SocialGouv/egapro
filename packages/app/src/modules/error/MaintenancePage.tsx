import { ErrorLayout } from "./ErrorLayout";

/** 503 Service Unavailable page content following DSFR error page template. */
export function MaintenancePage() {
	return (
		<ErrorLayout>
			<h1>Service indisponible</h1>
			<p className="fr-text-mention--grey fr-mb-3w">Erreur 503</p>
			<p className="fr-mb-3w">
				Désolé, le service est temporairement inaccessible, la page demandée ne
				peut être affichée.
			</p>
			<p>
				Merci de réessayer plus tard, vous serez bientôt en mesure de réutiliser
				le service.
			</p>
		</ErrorLayout>
	);
}

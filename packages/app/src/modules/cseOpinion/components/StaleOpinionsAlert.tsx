export function StaleOpinionsAlert() {
	return (
		<div className="fr-alert fr-alert--warning">
			<p className="fr-alert__title">Vérifiez les avis déjà renseignés</p>
			<p>
				La seconde déclaration a été modifiée depuis l'enregistrement de vos
				avis et de vos fichiers. Vérifiez qu'ils portent toujours sur les
				données à jour avant de les transmettre.
			</p>
		</div>
	);
}

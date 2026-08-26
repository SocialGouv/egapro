"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
	return (
		<main className="fr-container fr-py-8w" id="content">
			<div className="fr-alert fr-alert--error">
				<h1 className="fr-alert__title">
					Les résultats ne peuvent pas être chargés
				</h1>
				<p>
					Le service est momentanément indisponible. Vous pouvez réessayer sans
					perdre votre recherche.
				</p>
				<button className="fr-btn fr-mt-2w" onClick={reset} type="button">
					Réessayer
				</button>
			</div>
		</main>
	);
}

"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
	return (
		<main className="fr-container fr-py-8w" id="content">
			<div className="fr-alert fr-alert--error">
				<h1 className="fr-alert__title">
					La recherche est momentanément indisponible
				</h1>
				<p>Vos critères sont conservés. Réessayez dans quelques instants.</p>
				<button className="fr-btn fr-mt-2w" onClick={reset} type="button">
					Réessayer
				</button>
			</div>
		</main>
	);
}

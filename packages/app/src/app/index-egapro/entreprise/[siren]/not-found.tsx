import Link from "next/link";

export default function NotFound() {
	return (
		<main className="fr-container fr-py-8w" id="content">
			<h1>Résultats indisponibles</h1>
			<p>Cette entreprise n’a pas encore de déclaration rendue publique.</p>
			<Link
				className="fr-link fr-icon-arrow-left-line fr-link--icon-left"
				href="/index-egapro/recherche"
			>
				Revenir à la recherche
			</Link>
		</main>
	);
}

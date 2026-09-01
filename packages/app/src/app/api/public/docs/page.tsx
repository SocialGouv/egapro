import type { Metadata } from "next";
import { SwaggerUI } from "~/modules/export";

export const metadata: Metadata = {
	title: "Documentation de l’API publique",
	description:
		"Documentation interactive de l’API publique des indicateurs EgaPro.",
};

export default function PublicApiDocsPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-4w">
				<h1>Documentation de l’API publique EgaPro</h1>
				<p className="fr-text--lead">
					Consultez et réutilisez les indicateurs publics A à F. Les données
					personnelles, les avis CSE et l’indicateur G sont exclus.
				</p>
			</div>
			<SwaggerUI specUrl="/api/public/openapi.json" />
		</main>
	);
}

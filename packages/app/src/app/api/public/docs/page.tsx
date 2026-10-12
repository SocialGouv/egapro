import type { Metadata } from "next";
import { headers } from "next/headers";
import { SwaggerUI } from "~/modules/export";
import { API_PUBLIC_OPENAPI } from "~/modules/routes";
import { NONCE_HEADER } from "~/server/security/securityHeaders.js";

export const metadata: Metadata = {
	title: "Documentation de l’API publique",
	description:
		"Documentation interactive de l’API publique des indicateurs EgaPro.",
};

export default async function PublicApiDocsPage() {
	const nonce = (await headers()).get(NONCE_HEADER) ?? undefined;

	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-4w">
				<h1>Documentation de l’API publique EgaPro</h1>
				<p className="fr-text--lead">
					Consultez et réutilisez les indicateurs publics A à F. Les données
					personnelles, les avis CSE et l’indicateur G sont exclus.
				</p>
			</div>
			<SwaggerUI nonce={nonce} specUrl={API_PUBLIC_OPENAPI} />
		</main>
	);
}

import { redirect } from "next/navigation";

import { auth } from "~/server/auth";

export default async function LoginPage() {
	const session = await auth();

	if (session?.user) {
		redirect("/");
	}

	return (
		<main id="content" className="fr-container fr-my-4w">
			<div className="fr-grid-row fr-grid-row--center">
				<div className="fr-col-12 fr-col-md-6">
					<h1>Connexion</h1>
					<p>
						Connectez-vous avec votre compte ProConnect pour accéder à Egapro.
					</p>
					<a
						className="fr-btn"
						href="/api/auth/signin/proconnect"
					>
						Se connecter avec ProConnect
					</a>
				</div>
			</div>
		</main>
	);
}

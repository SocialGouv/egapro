import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { LoginButton } from "./LoginButton";

export default async function LoginPage() {
	const session = await auth();

	if (session?.user) {
		redirect("/declaration-remuneration");
	}

	return (
		<main className="fr-container fr-my-4w" id="content">
			<div className="fr-grid-row fr-grid-row--center">
				<div className="fr-col-12 fr-col-md-6">
					<h1>Connexion</h1>
					<p>
						Connectez-vous avec votre compte ProConnect pour accéder à Egapro.
					</p>
					<LoginButton />
				</div>
			</div>
		</main>
	);
}

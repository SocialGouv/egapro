import { redirect } from "next/navigation";

import { auth } from "~/server/auth";

export default async function LoginPage() {
	const session = await auth();

	if (session?.user) {
		redirect("/");
	}

	return (
		<main className="fr-container fr-my-4w" id="content">
			<div className="fr-grid-row fr-grid-row--center">
				<div className="fr-col-12 fr-col-md-6">
					<h1>Sign in</h1>
					<p>Sign in with your ProConnect account to access Egapro.</p>
					<a className="fr-btn" href="/api/auth/signin/proconnect">
						Sign in with ProConnect
					</a>
				</div>
			</div>
		</main>
	);
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "~/env.js";
import { DevLoginForm } from "~/modules/login/DevLoginForm";

export const metadata: Metadata = {
	robots: { follow: false, index: false },
	title: "Connexion de développement",
};

type Props = {
	searchParams: Promise<{ callbackUrl?: string }>;
};

/**
 * Dev-only sign-in route. Mirrors the guard on the `dev-auth` provider: the
 * page 404s unless `EGAPRO_DEV_AUTH` is on and the runtime is not production,
 * so it cannot be reached on a deployed environment even if the file ships.
 */
export default async function DevLoginPage({ searchParams }: Props) {
	if (!env.EGAPRO_DEV_AUTH || env.NODE_ENV === "production") {
		notFound();
	}

	const { callbackUrl } = await searchParams;

	return (
		<div className="fr-container fr-my-6w">
			<h1>Connexion de développement</h1>
			<p className="fr-text--sm fr-text-mention--grey">
				Cette page n'existe qu'en développement. Elle ouvre une session sans
				passer par ProConnect, pour l'entreprise dont vous saisissez le SIRET.
			</p>
			<DevLoginForm callbackUrl={callbackUrl} />
		</div>
	);
}

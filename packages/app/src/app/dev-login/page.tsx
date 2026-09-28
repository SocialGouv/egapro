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
 * Dev-only sign-in route. Convenience only: hiding the page protects nothing
 * on its own, since the sign-in surface is the `dev-auth` provider itself
 * (reachable by POSTing to its callback). The provider's own guards — env
 * flag, production throw, loopback-host check — are what actually keep it
 * closed; this page just avoids advertising a route that cannot work.
 */
export default async function DevLoginPage({ searchParams }: Props) {
	const isDevAuthEnabled =
		env.EGAPRO_DEV_AUTH === true && env.NODE_ENV !== "production";
	if (!isDevAuthEnabled) notFound();

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

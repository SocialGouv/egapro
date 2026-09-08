import Link from "next/link";

import type { AdminMfaFailure } from "~/modules/domain";

import { AdminAccessResumeButton } from "./AdminAccessResumeButton";

type Props = {
	reason: AdminMfaFailure;
	returnPath: string;
};

const CONTENT: Record<AdminMfaFailure, { title: string; body: string }> = {
	expired: {
		title: "Votre accès au backoffice a expiré",
		body: "Pour des raisons de sécurité, l'accès à l'espace d'administration demande une double authentification récente. La vôtre est arrivée à échéance.",
	},
	missing: {
		title: "La double authentification n'a pas abouti",
		body: "L'accès à l'espace d'administration demande une double authentification ProConnect. Votre session n'en porte pas.",
	},
};

/**
 * Landing screen of an eligible agent whose two-factor authentication is
 * missing or out of the window. An Egapro screen rather than a silent redirect:
 * the agent is told what is being asked of them, and decides when to go through
 * ProConnect again.
 *
 * Both states are derived from the session on the server — a reason carried in
 * the URL would be displayable at will.
 */
export function AdminAccessPage({ reason, returnPath }: Props) {
	const { title, body } = CONTENT[reason];

	return (
		<main className="fr-container fr-py-6w" id="content" tabIndex={-1}>
			<div className="fr-grid-row fr-grid-row--center">
				<div className="fr-col-12 fr-col-md-8">
					<h1>{title}</h1>
					<p className="fr-mb-3w">{body}</p>
					<p className="fr-mb-5w">
						Votre espace déclarant reste accessible : seule l&apos;entrée dans
						l&apos;espace d&apos;administration demande ce second facteur.
					</p>
					<ul className="fr-btns-group fr-btns-group--inline-md">
						<li>
							<AdminAccessResumeButton returnPath={returnPath} />
						</li>
						<li>
							<Link className="fr-btn fr-btn--secondary" href="/mon-espace">
								Retourner à Mon espace
							</Link>
						</li>
					</ul>
				</div>
			</div>
		</main>
	);
}

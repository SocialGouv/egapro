import Link from "next/link";

import { CONTACT, MY_SPACE } from "~/modules/routes";

type Props = {
	roles: string[];
	organizationLabel: string | null;
	siret: string | null;
};

const NOT_COMMUNICATED = "non communiqué";

function formatRoles(roles: string[]): string {
	return roles.length > 0 ? roles.join(", ") : "aucun";
}

// ProConnect's roles-scope doc requires stating the blocking rule, the
// user's roles and their organization — never a silent redirect.
export function AdminAccessDeniedPage({
	roles,
	organizationLabel,
	siret,
}: Props) {
	return (
		<main className="fr-container fr-py-6w" id="content" tabIndex={-1}>
			<div className="fr-grid-row fr-grid-row--center">
				<div className="fr-col-12 fr-col-md-8">
					<h1>Accès à l&apos;administration refusé</h1>
					<p className="fr-mb-5w">
						L&apos;espace d&apos;administration d&apos;Egapro est réservé aux
						agents publics. Les rôles que ProConnect vous associe sont :{" "}
						{formatRoles(roles)}, pour l&apos;organisation de rattachement «{" "}
						{organizationLabel ?? NOT_COMMUNICATED} » (SIRET :{" "}
						{siret ?? NOT_COMMUNICATED}).
					</p>
					<ul className="fr-btns-group fr-btns-group--inline-md">
						<li>
							<Link className="fr-btn" href={MY_SPACE}>
								Retourner à Mon espace
							</Link>
						</li>
						<li>
							<Link className="fr-btn fr-btn--secondary" href={CONTACT}>
								Contacter l&apos;équipe Egapro
							</Link>
						</li>
					</ul>
				</div>
			</div>
		</main>
	);
}

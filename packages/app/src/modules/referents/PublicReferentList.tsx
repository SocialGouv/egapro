import Link from "next/link";

import type { CountyCode, RegionCode } from "~/modules/domain";
import { COUNTIES, REGIONS } from "~/modules/domain";

import type { PublicReferentListRow } from "./types";

type Props = {
	rows: PublicReferentListRow[];
};

/**
 * Semantic list of referents — intentionally no contact details, users must
 * navigate to the detail page to reveal the email/URL (anti-harvest).
 */
export function PublicReferentList({ rows }: Props) {
	if (rows.length === 0) {
		return (
			<p className="fr-text--lg fr-text-mention--grey fr-my-4w">
				Aucun référent ne correspond à votre recherche.
			</p>
		);
	}

	return (
		<ul className="fr-raw-list" data-testid="public-referents-list">
			{rows.map((row) => (
				<li className="fr-mb-2w" key={row.id}>
					<article className="fr-p-3w fr-background-alt--grey">
						<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
							<div className="fr-col">
								<h2 className="fr-h5 fr-mb-1v">{row.name}</h2>
								<p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
									{REGIONS[row.region as RegionCode] ?? row.region}
									{row.county
										? ` — ${COUNTIES[row.county as CountyCode] ?? row.county}`
										: ""}
								</p>
								{row.principal && (
									<p className="fr-badge fr-badge--success fr-badge--sm fr-badge--no-icon">
										Référent principal
									</p>
								)}
							</div>
							<div className="fr-col-auto">
								<Link
									className="fr-btn fr-btn--secondary fr-btn--sm"
									href={`/referents/${row.id}`}
								>
									Voir le contact
								</Link>
							</div>
						</div>
					</article>
				</li>
			))}
		</ul>
	);
}

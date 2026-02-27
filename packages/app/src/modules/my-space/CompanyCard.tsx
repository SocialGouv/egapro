import Link from "next/link";

import type { CompanyItem } from "./types";
import { StatusBadge } from "./StatusBadge";

type Props = {
	company: CompanyItem;
};

export function CompanyCard({ company }: Props) {
	return (
		<div className="fr-card fr-card--horizontal fr-card--sm fr-enlarge-link">
			<div className="fr-card__body">
				<div className="fr-card__content">
					<h3 className="fr-card__title">
						<Link href={`/declaration-remuneration?siren=${company.siren}`}>
							{company.name}
						</Link>
					</h3>
					<div className="fr-card__start">
						<ul className="fr-badges-group">
							<li>
								<StatusBadge status={company.declarationStatus} />
							</li>
						</ul>
					</div>
					<div className="fr-card__end">
						<p className="fr-card__detail">N° SIREN : {company.siren}</p>
					</div>
				</div>
			</div>
		</div>
	);
}

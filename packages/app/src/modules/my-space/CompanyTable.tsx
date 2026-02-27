import Link from "next/link";

import { StatusBadge } from "./StatusBadge";
import type { CompanyItem } from "./types";

type Props = {
	companies: CompanyItem[];
};

export function CompanyTable({ companies }: Props) {
	return (
		<div className="fr-table">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption className="fr-sr-only">Liste des entreprises</caption>
							<thead>
								<tr>
									<th scope="col">Entreprise</th>
									<th scope="col">SIREN</th>
									<th scope="col">Statut</th>
								</tr>
							</thead>
							<tbody>
								{companies.map((company) => (
									<tr key={company.siren}>
										<td>
											<Link
												href={`/mon-espace/mes-entreprises/${company.siren}`}
											>
												{company.name}
											</Link>
										</td>
										<td>{company.siren}</td>
										<td>
											<StatusBadge status={company.declarationStatus} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

import { formatCount } from "~/modules/domain";

import type { FunnelRow } from "./types";

type Props = {
	rows: FunnelRow[];
	caption: string;
};

function formatDrop(value: number | null): string {
	if (value === null) return "—";
	return `${value} %`;
}

/**
 * Accessible alternative to `<CompletionFunnelChart>` — same K19 dataset
 * rendered as a DSFR table inside a `<details>` toggle. Required for RGAA
 * because the Recharts SVG is not navigable by assistive tech.
 */
export function CompletionFunnelTable({ rows, caption }: Props) {
	if (rows.length === 0) return null;

	return (
		<details className="fr-mt-3w">
			<summary className="fr-text--sm">
				Consulter les données du graphique sous forme de tableau
			</summary>
			<div className="fr-table fr-table--bordered fr-mt-2w">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption className="fr-sr-only">{caption}</caption>
								<thead>
									<tr>
										<th scope="col">Étape</th>
										<th scope="col">Déclarations</th>
										<th scope="col">% du funnel</th>
										<th scope="col">Chute vs précédente</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row) => (
										<tr key={row.key}>
											<th scope="row">{row.label}</th>
											<td>{formatCount(row.count)}</td>
											<td>{row.pctOfStart} %</td>
											<td>{formatDrop(row.pctDropFromPrev)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</details>
	);
}

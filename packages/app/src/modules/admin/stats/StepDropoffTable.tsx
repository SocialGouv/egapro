import type { StepDropoffRow } from "./types";

type Props = {
	rows: StepDropoffRow[];
};

function formatPercent(value: number): string {
	return value.toLocaleString("fr-FR", {
		maximumFractionDigits: 1,
		minimumFractionDigits: 1,
	});
}

function formatCount(value: number): string {
	return value.toLocaleString("fr-FR");
}

/**
 * Accessible alternative to `<StepDropoffChart>` — same K5 dataset rendered
 * as a DSFR table inside a `<details>` toggle. Required for RGAA because
 * the Recharts SVG is not navigable by assistive tech.
 */
export function StepDropoffTable({ rows }: Props) {
	if (rows.length === 0) {
		return null;
	}

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
								<caption className="fr-sr-only">
									Taux d'abandon, nombre de déclarations abandonnées et nombre
									total de déclarations entrées par étape du parcours
									indicateurs.
								</caption>
								<thead>
									<tr>
										<th scope="col">Étape</th>
										<th scope="col">Taux d'abandon (%)</th>
										<th scope="col">Abandonnées</th>
										<th scope="col">Total entreprises passées par l'étape</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row) => (
										<tr key={`step_${row.step}`}>
											<th scope="row">{row.label}</th>
											<td>{formatPercent(row.dropoffRate)}</td>
											<td>{formatCount(row.abandoned)}</td>
											<td>{formatCount(row.total)}</td>
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

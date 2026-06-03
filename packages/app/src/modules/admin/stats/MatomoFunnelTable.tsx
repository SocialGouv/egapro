import { formatCount } from "./formatters";
import type { MatomoFunnelOutput } from "./types";

function formatDurationSeconds(value: number | null): string {
	if (value === null) return "—";
	if (value < 60) return `${value} s`;
	const minutes = Math.floor(value / 60);
	const seconds = value % 60;
	return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} s`;
}

type Props = {
	caption: string;
	data: MatomoFunnelOutput;
};

/**
 * Accessible alternative to `<MatomoFunnelChart>` — the same K20/K21 dataset as
 * a DSFR table, with the per-step average durations the funnel chart cannot
 * show. Required for RGAA because the chart is rendered as a canvas.
 */
export function MatomoFunnelTable({ caption, data }: Props) {
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
										<th scope="col">Parcours</th>
										<th scope="col">Durée moyenne</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<th scope="row">Entrées</th>
										<td>{formatCount(data.startedCount)}</td>
										<td>—</td>
									</tr>
									{data.steps.map((step) => (
										<tr key={step.stepKey}>
											<th scope="row">{step.label}</th>
											<td>{formatCount(step.completedCount)}</td>
											<td>{formatDurationSeconds(step.avgDurationSeconds)}</td>
										</tr>
									))}
									<tr>
										<th scope="row">Complétions</th>
										<td>{formatCount(data.completedCount)}</td>
										<td>—</td>
									</tr>
									<tr>
										<th scope="row">Abandons</th>
										<td>{formatCount(data.abandonedCount)}</td>
										<td>—</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</details>
	);
}

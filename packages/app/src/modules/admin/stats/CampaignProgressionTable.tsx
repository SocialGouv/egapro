import { formatMonthDay } from "./format";
import type { CampaignProgressionSeries } from "./types";

type Props = {
	series: CampaignProgressionSeries[];
};

/**
 * Accessible alternative to `<CampaignProgressionChart>` — renders the same
 * cumulative-submission data as a DSFR table. Required for RGAA: a pure
 * Recharts SVG is not readable by assistive tech, so we surface the numbers
 * in a `<details>` toggle that lives in the DOM at all times.
 */
export function CampaignProgressionTable({ series }: Props) {
	if (series.length === 0) {
		return null;
	}

	const dayKeys = Array.from(
		new Set(
			series.flatMap(({ points }) => points.map(({ day }) => day.slice(5))),
		),
	).sort((a, b) => a.localeCompare(b));

	const byDayByYear = new Map<number, Map<string, number>>();
	for (const { year, points } of series) {
		const map = new Map<string, number>();
		for (const { day, cumulative } of points) {
			map.set(day.slice(5), cumulative);
		}
		byDayByYear.set(year, map);
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
									Déclarations cumulées par jour calendaire et par année.
								</caption>
								<thead>
									<tr>
										<th scope="col">Jour</th>
										{series.map(({ year }) => (
											<th key={year} scope="col">
												{year}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{dayKeys.map((key) => (
										<tr key={key}>
											<th scope="row">{formatMonthDay(key)}</th>
											{series.map(({ year }) => {
												const value = byDayByYear.get(year)?.get(key);
												return (
													<td key={year}>
														{value != null
															? value.toLocaleString("fr-FR")
															: "—"}
													</td>
												);
											})}
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

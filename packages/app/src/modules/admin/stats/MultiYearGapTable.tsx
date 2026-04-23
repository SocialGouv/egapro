import { formatCount, formatGap } from "~/modules/domain";

import type { MultiYearGapTrendSeries } from "./types";

type Props = {
	series: MultiYearGapTrendSeries[];
};

/**
 * Accessible alternative to `<MultiYearGapChart>` — renders the same
 * (segment × year) data as a DSFR table. Required for RGAA: a Recharts SVG
 * is not readable by assistive tech, so we surface the numbers in a
 * `<details>` toggle that lives in the DOM at all times.
 */
export function MultiYearGapTable({ series }: Props) {
	if (series.length === 0) return null;

	const years = Array.from(
		new Set(series.flatMap(({ points }) => points.map(({ year }) => year))),
	).sort((a, b) => a - b);

	const byYearBySegment = new Map<
		string,
		Map<number, { avgGap: number | null; sampleSize: number }>
	>();
	for (const { segment, points } of series) {
		const inner = new Map<
			number,
			{ avgGap: number | null; sampleSize: number }
		>();
		for (const { year, avgGap, sampleSize } of points) {
			inner.set(year, { avgGap, sampleSize });
		}
		byYearBySegment.set(segment, inner);
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
									Écart moyen de rémunération par segment et par année.
								</caption>
								<thead>
									<tr>
										<th scope="col">Segment</th>
										{years.map((year) => (
											<th key={year} scope="col">
												{year}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{series.map(({ segment }) => (
										<tr key={segment}>
											<th scope="row">{segment}</th>
											{years.map((year) => {
												const cell = byYearBySegment.get(segment)?.get(year);
												if (!cell || cell.avgGap === null) {
													return <td key={year}>—</td>;
												}
												return (
													<td key={year}>
														{formatGap(cell.avgGap)} (sur{" "}
														{formatCount(cell.sampleSize)})
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

import { formatCount } from "~/modules/domain";

export type StatsTableColumn<Row> = {
	key: Extract<keyof Row, string>;
	label: string;
};

type Props<Row extends { key: string; label: string }> = {
	caption: string;
	rowHeader: string;
	columns: StatsTableColumn<Row>[];
	rows: Row[];
};

function formatValue(value: unknown): string {
	if (typeof value === "number") return formatCount(value);
	if (typeof value === "string") return value;
	return "0";
}

/**
 * Accessible alternative to `<StatsBarChart>` — the same dataset rendered as a
 * DSFR table inside a `<details>` toggle (required for RGAA because the recharts
 * SVG is not navigable by assistive tech). Generic over the value columns so it
 * serves the model-usage / help-link (single column) and device-split (three
 * columns) widgets alike.
 */
export function StatsBarTable<Row extends { key: string; label: string }>({
	caption,
	rowHeader,
	columns,
	rows,
}: Props<Row>) {
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
										<th scope="col">{rowHeader}</th>
										{columns.map((column) => (
											<th key={column.key} scope="col">
												{column.label}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{rows.map((row) => (
										<tr key={row.key}>
											<th scope="row">{row.label}</th>
											{columns.map((column) => (
												<td key={column.key}>{formatValue(row[column.key])}</td>
											))}
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

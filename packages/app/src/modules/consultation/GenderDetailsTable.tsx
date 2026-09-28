import { DsfrTable } from "~/modules/shared/DsfrTable";
import styles from "./GenderDetailsTable.module.scss";

export type DetailsRow = { label: string; values: string[] };

type Props = {
	/** Screen-reader-only table caption; the Figma cards show no visible one. */
	caption: string;
	/** Value columns, e.g. ["Femmes", "Hommes"]. The row label column has none. */
	columns: string[];
	rows: DetailsRow[];
	className?: string;
};

/**
 * The table behind every "Détails des données" disclosure. It is the accessible
 * counterpart of the bars drawn above it, so its figures must match them
 * exactly — same source, same formatter.
 */
export function GenderDetailsTable({
	caption,
	columns,
	rows,
	className = "fr-mt-0 fr-mb-0",
}: Props) {
	return (
		<DsfrTable
			caption={caption}
			className={className}
			tableClassName={styles.table}
		>
			<colgroup>
				<col />
				{columns.map((column) => (
					<col key={column} />
				))}
			</colgroup>
			<thead>
				<tr>
					<th scope="col">
						<span className="fr-sr-only">Indicateur</span>
					</th>
					{columns.map((column) => (
						<th key={column} scope="col">
							{column}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rows.map((row) => (
					<tr key={row.label}>
						<th scope="row">{row.label}</th>
						{row.values.map((value, index) => (
							<td key={`${row.label}-${columns[index] ?? index}`}>{value}</td>
						))}
					</tr>
				))}
			</tbody>
		</DsfrTable>
	);
}

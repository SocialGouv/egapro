"use client";

export interface DataTableColumn {
	key: string;
	label: string;
	type?: "text" | "number";
	readOnly?: boolean;
}

interface DataTableProps {
	caption: string;
	columns: DataTableColumn[];
	rows: Record<string, string | number | null | undefined>[];
	onCellChange?: (rowIndex: number, columnKey: string, value: string) => void;
	showTotal?: boolean;
	totalLabel?: string;
}

export function DataTable({
	caption,
	columns,
	rows,
	onCellChange,
	showTotal = false,
	totalLabel = "Total",
}: DataTableProps) {
	const totals = showTotal
		? columns.reduce(
				(acc, col) => {
					if (col.type === "number" && !col.readOnly) {
						acc[col.key] = rows.reduce((sum, row) => {
							const val = row[col.key];
							return sum + (typeof val === "number" ? val : Number(val) || 0);
						}, 0);
					}
					return acc;
				},
				{} as Record<string, number>,
			)
		: null;

	return (
		<div className="fr-table fr-table--bordered fr-table--no-caption">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption>{caption}</caption>
							<thead>
								<tr>
									{columns.map((col) => (
										<th key={col.key} scope="col">
											{col.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{rows.map((row, rowIndex) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: rows identified by position
									<tr key={rowIndex}>
										{columns.map((col) => (
											<td key={col.key}>
												{col.readOnly ? (
													(row[col.key] ?? "-")
												) : (
													<div className="fr-input-group fr-mb-0">
														<input
															aria-label={`${col.label} - ${row[columns[0]?.key ?? ""] ?? `Ligne ${rowIndex + 1}`}`}
															className="fr-input"
															min={col.type === "number" ? 0 : undefined}
															onChange={(e) =>
																onCellChange?.(
																	rowIndex,
																	col.key,
																	e.target.value,
																)
															}
															type={col.type === "number" ? "number" : "text"}
															value={row[col.key] ?? ""}
														/>
													</div>
												)}
											</td>
										))}
									</tr>
								))}
								{totals && (
									<tr>
										{columns.map((col, colIndex) => (
											<td key={col.key}>
												{colIndex === 0 ? (
													<strong>{totalLabel}</strong>
												) : totals[col.key] !== undefined ? (
													<strong>{totals[col.key]}</strong>
												) : (
													"-"
												)}
											</td>
										))}
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

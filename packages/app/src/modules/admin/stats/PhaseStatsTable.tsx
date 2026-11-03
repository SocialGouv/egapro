import { useId } from "react";

type Phase = "wizard" | "post_submit";

type PhaseRow = {
	key: string;
	phase: Phase;
	label: string;
};

export type PhaseStatsColumn<Row extends PhaseRow> = {
	key: string;
	label: string;
	render: (row: Row) => string;
};

type Props<Row extends PhaseRow> = {
	caption: string;
	rowHeader: string;
	columns: PhaseStatsColumn<Row>[];
	rows: Row[];
};

const PHASES: Phase[] = ["wizard", "post_submit"];

const PHASE_HEADERS: Record<Phase, string> = {
	wizard: "Parcours initial (wizard A–F)",
	post_submit: "Démarche post-transmission",
};

const PHASE_HEADER_CLASSES: Record<Phase, string> = {
	wizard: "fr-text--bold fr-background-alt--blue-france",
	post_submit: "fr-text--bold fr-background-alt--red-marianne",
};

type PhaseDataRowProps<Row extends PhaseRow> = {
	row: Row;
	phaseId: string;
	tableId: string;
	columns: PhaseStatsColumn<Row>[];
};

function PhaseDataRow<Row extends PhaseRow>({
	row,
	phaseId,
	tableId,
	columns,
}: PhaseDataRowProps<Row>) {
	const rowId = `${tableId}-row-${row.key}`;
	return (
		<tr>
			<th id={rowId} scope="row">
				{row.label}
			</th>
			{columns.map((column) => (
				<td
					headers={`${phaseId} ${rowId} ${tableId}-col-${column.key}`}
					key={column.key}
				>
					{column.render(row)}
				</td>
			))}
		</tr>
	);
}

type PhaseRowGroupProps<Row extends PhaseRow> = {
	phase: Phase;
	rows: Row[];
	tableId: string;
	columns: PhaseStatsColumn<Row>[];
};

function PhaseRowGroup<Row extends PhaseRow>({
	phase,
	rows,
	tableId,
	columns,
}: PhaseRowGroupProps<Row>) {
	if (rows.length === 0) {
		return null;
	}

	const phaseId = `${tableId}-phase-${phase}`;
	// RGAA 5.7.3: a row-group header takes no scope; each cell cites it with its row and column headers.
	return (
		<tbody>
			<tr>
				<th
					className={PHASE_HEADER_CLASSES[phase]}
					colSpan={columns.length + 1}
					id={phaseId}
				>
					{PHASE_HEADERS[phase]}
				</th>
			</tr>
			{rows.map((row) => (
				<PhaseDataRow
					columns={columns}
					key={row.key}
					phaseId={phaseId}
					row={row}
					tableId={tableId}
				/>
			))}
		</tbody>
	);
}

export function PhaseStatsTable<Row extends PhaseRow>({
	caption,
	rowHeader,
	columns,
	rows,
}: Props<Row>) {
	const tableId = useId();

	if (rows.length === 0) {
		return null;
	}

	const rowsByPhase = PHASES.map((phase) => ({
		phase,
		rows: rows.filter((row) => row.phase === phase),
	}));

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
											<th
												id={`${tableId}-col-${column.key}`}
												key={column.key}
												scope="col"
											>
												{column.label}
											</th>
										))}
									</tr>
								</thead>
								{rowsByPhase.map((group) => (
									<PhaseRowGroup
										columns={columns}
										key={group.phase}
										phase={group.phase}
										rows={group.rows}
										tableId={tableId}
									/>
								))}
							</table>
						</div>
					</div>
				</div>
			</div>
		</details>
	);
}

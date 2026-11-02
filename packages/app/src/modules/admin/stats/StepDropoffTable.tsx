import { useId } from "react";
import { formatCount, formatFixedPercentage } from "~/modules/domain";
import type { StepDropoffRow } from "./types";

type Props = {
	rows: StepDropoffRow[];
};

type Phase = StepDropoffRow["phase"];

type ColumnIds = {
	rate: string;
	abandoned: string;
	total: string;
};

const PHASE_HEADERS: Record<Phase, string> = {
	wizard: "Parcours initial (wizard A–F)",
	post_submit: "Démarche post-transmission",
};

const PHASE_HEADER_CLASSES: Record<Phase, string> = {
	wizard: "fr-text--bold fr-background-alt--blue-france",
	post_submit: "fr-text--bold fr-background-alt--red-marianne",
};

type DropoffRowProps = {
	row: StepDropoffRow;
	rowId: string;
	phaseId: string;
	columnIds: ColumnIds;
};

function DropoffRow({ row, rowId, phaseId, columnIds }: DropoffRowProps) {
	const headers = (columnId: string) => `${phaseId} ${rowId} ${columnId}`;
	return (
		<tr>
			<th id={rowId} scope="row">
				{row.label}
			</th>
			<td headers={headers(columnIds.rate)}>
				{formatFixedPercentage(row.dropoffRate)}
			</td>
			<td headers={headers(columnIds.abandoned)}>
				{formatCount(row.abandoned)}
			</td>
			<td headers={headers(columnIds.total)}>{formatCount(row.total)}</td>
		</tr>
	);
}

type PhaseRowGroupProps = {
	phase: Phase;
	rows: StepDropoffRow[];
	tableId: string;
	columnIds: ColumnIds;
};

function PhaseRowGroup({
	phase,
	rows,
	tableId,
	columnIds,
}: PhaseRowGroupProps) {
	if (rows.length === 0) {
		return null;
	}

	const phaseId = `${tableId}-phase-${phase}`;
	return (
		<tbody>
			<tr>
				<th className={PHASE_HEADER_CLASSES[phase]} colSpan={4} id={phaseId}>
					{PHASE_HEADERS[phase]}
				</th>
			</tr>
			{rows.map((row) => (
				<DropoffRow
					columnIds={columnIds}
					key={row.key}
					phaseId={phaseId}
					row={row}
					rowId={`${tableId}-row-${row.key}`}
				/>
			))}
		</tbody>
	);
}

/**
 * Accessible alternative to `<StepDropoffChart>` — same K5 dataset rendered
 * as a DSFR table inside a `<details>` toggle. Required for RGAA because
 * the Recharts SVG is not navigable by assistive tech.
 */
export function StepDropoffTable({ rows }: Props) {
	const tableId = useId();

	if (rows.length === 0) {
		return null;
	}

	const columnIds: ColumnIds = {
		rate: `${tableId}-rate`,
		abandoned: `${tableId}-abandoned`,
		total: `${tableId}-total`,
	};
	const wizardRows = rows.filter((row) => row.phase === "wizard");
	const postSubmitRows = rows.filter((row) => row.phase === "post_submit");

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
									total de déclarations entrées par phase du parcours déclaratif
									: étapes du wizard A–F puis phases post-transmission.
								</caption>
								<thead>
									<tr>
										<th scope="col">Phase</th>
										<th id={columnIds.rate} scope="col">
											Taux d'abandon (%)
										</th>
										<th id={columnIds.abandoned} scope="col">
											Abandonnées
										</th>
										<th id={columnIds.total} scope="col">
											Total déclarations entrées dans la phase
										</th>
									</tr>
								</thead>
								<PhaseRowGroup
									columnIds={columnIds}
									phase="wizard"
									rows={wizardRows}
									tableId={tableId}
								/>
								<PhaseRowGroup
									columnIds={columnIds}
									phase="post_submit"
									rows={postSubmitRows}
									tableId={tableId}
								/>
							</table>
						</div>
					</div>
				</div>
			</div>
		</details>
	);
}

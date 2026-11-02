import { useId } from "react";
import { formatCount, formatDays } from "~/modules/domain";
import type { StepDurationRow } from "./types";

type Props = {
	rows: StepDurationRow[];
};

type Phase = StepDurationRow["phase"];

type ColumnIds = {
	median: string;
	p90: string;
	sample: string;
};

const PHASE_HEADERS: Record<Phase, string> = {
	wizard: "Parcours initial (wizard A–F)",
	post_submit: "Démarche post-transmission",
};

const PHASE_HEADER_CLASSES: Record<Phase, string> = {
	wizard: "fr-text--bold fr-background-alt--blue-france",
	post_submit: "fr-text--bold fr-background-alt--red-marianne",
};

type DurationRowProps = {
	row: StepDurationRow;
	rowId: string;
	phaseId: string;
	columnIds: ColumnIds;
};

function DurationRow({ row, rowId, phaseId, columnIds }: DurationRowProps) {
	const headers = (columnId: string) => `${phaseId} ${rowId} ${columnId}`;
	return (
		<tr>
			<th id={rowId} scope="row">
				{row.label}
			</th>
			<td headers={headers(columnIds.median)}>{formatDays(row.medianDays)}</td>
			<td headers={headers(columnIds.p90)}>{formatDays(row.p90Days)}</td>
			<td headers={headers(columnIds.sample)}>{formatCount(row.sampleSize)}</td>
		</tr>
	);
}

type PhaseRowGroupProps = {
	phase: Phase;
	rows: StepDurationRow[];
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
				<DurationRow
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
 * Accessible alternative to `<StepDurationsChart>` — same K4 dataset rendered
 * as a DSFR table inside a `<details>` toggle. Required for RGAA because the
 * Recharts SVG is not navigable by assistive tech.
 */
export function StepDurationsTable({ rows }: Props) {
	const tableId = useId();

	if (rows.length === 0) {
		return null;
	}

	const columnIds: ColumnIds = {
		median: `${tableId}-median`,
		p90: `${tableId}-p90`,
		sample: `${tableId}-sample`,
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
									Délai médian et 90e percentile en jours par étape du parcours
									indicateurs et par jalon de la démarche post-transmission, et
									nombre de déclarations concernées.
								</caption>
								<thead>
									<tr>
										<th scope="col">Étape ou jalon</th>
										<th id={columnIds.median} scope="col">
											Médiane (j)
										</th>
										<th id={columnIds.p90} scope="col">
											p90 (j)
										</th>
										<th id={columnIds.sample} scope="col">
											Échantillon
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

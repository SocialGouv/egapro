import { formatCount, formatDays } from "~/modules/domain";
import { type PhaseStatsColumn, PhaseStatsTable } from "./PhaseStatsTable";
import type { StepDurationRow } from "./types";

type Props = {
	rows: StepDurationRow[];
};

const COLUMNS: PhaseStatsColumn<StepDurationRow>[] = [
	{
		key: "median",
		label: "Médiane (j)",
		render: (row) => formatDays(row.medianDays),
	},
	{ key: "p90", label: "p90 (j)", render: (row) => formatDays(row.p90Days) },
	{
		key: "sample",
		label: "Échantillon",
		render: (row) => formatCount(row.sampleSize),
	},
];

/**
 * Accessible alternative to `<StepDurationsChart>` — same K4 dataset rendered
 * as a DSFR table inside a `<details>` toggle. Required for RGAA because the
 * Recharts SVG is not navigable by assistive tech.
 */
export function StepDurationsTable({ rows }: Props) {
	return (
		<PhaseStatsTable
			caption="Délai médian et 90e percentile en jours par étape du parcours indicateurs et par jalon de la démarche post-transmission, et nombre de déclarations concernées."
			columns={COLUMNS}
			rowHeader="Étape ou jalon"
			rows={rows}
		/>
	);
}

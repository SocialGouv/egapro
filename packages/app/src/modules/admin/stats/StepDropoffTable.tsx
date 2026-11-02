import { formatCount, formatFixedPercentage } from "~/modules/domain";
import { type PhaseStatsColumn, PhaseStatsTable } from "./PhaseStatsTable";
import type { StepDropoffRow } from "./types";

type Props = {
	rows: StepDropoffRow[];
};

const COLUMNS: PhaseStatsColumn<StepDropoffRow>[] = [
	{
		key: "rate",
		label: "Taux d'abandon (%)",
		render: (row) => formatFixedPercentage(row.dropoffRate),
	},
	{
		key: "abandoned",
		label: "Abandonnées",
		render: (row) => formatCount(row.abandoned),
	},
	{
		key: "total",
		label: "Total déclarations entrées dans la phase",
		render: (row) => formatCount(row.total),
	},
];

/**
 * Accessible alternative to `<StepDropoffChart>` — same K5 dataset rendered
 * as a DSFR table inside a `<details>` toggle. Required for RGAA because
 * the Recharts SVG is not navigable by assistive tech.
 */
export function StepDropoffTable({ rows }: Props) {
	return (
		<PhaseStatsTable
			caption="Taux d'abandon, nombre de déclarations abandonnées et nombre total de déclarations entrées par phase du parcours déclaratif : étapes du wizard A–F puis phases post-transmission."
			columns={COLUMNS}
			rowHeader="Phase"
			rows={rows}
		/>
	);
}

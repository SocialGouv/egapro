import {
	formatCount,
	formatFixedPercentage,
	isDropoffRateAboveThreshold,
} from "~/modules/domain";
import {
	DROPOFF_ALERT_MARK,
	DROPOFF_THRESHOLD_COLUMN_LABEL,
} from "./constants";
import { type PhaseStatsColumn, PhaseStatsTable } from "./PhaseStatsTable";
import type { StepDropoffRow } from "./types";

type Props = {
	rows: StepDropoffRow[];
};

const CAPTION = `Taux d'abandon, nombre de déclarations abandonnées et nombre total de déclarations entrées par phase du parcours déclaratif : étapes du wizard A–F puis phases post-transmission. La dernière colonne « ${DROPOFF_THRESHOLD_COLUMN_LABEL} » signale les phases dont le taux d'abandon dépasse le seuil d'alerte.`;

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
	{
		key: "aboveThreshold",
		label: DROPOFF_THRESHOLD_COLUMN_LABEL,
		render: (row) =>
			isDropoffRateAboveThreshold(row.dropoffRate) ? (
				<span className="fr-text--bold">
					<span aria-hidden="true">{DROPOFF_ALERT_MARK}</span> Oui
				</span>
			) : (
				"Non"
			),
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
			caption={CAPTION}
			columns={COLUMNS}
			rowHeader="Phase"
			rows={rows}
		/>
	);
}

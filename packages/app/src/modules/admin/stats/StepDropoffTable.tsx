import {
	DROPOFF_RATE_ALERT_THRESHOLD,
	formatCount,
	formatFixedPercentage,
	formatWholePercentage,
	isDropoffRateAboveThreshold,
} from "~/modules/domain";
import { DROPOFF_ALERT_MARK } from "./constants";
import type { StepDropoffRow } from "./types";

type Props = {
	rows: StepDropoffRow[];
};

const PHASE_HEADERS: Record<StepDropoffRow["phase"], string> = {
	wizard: "Parcours initial (wizard A–F)",
	post_submit: "Démarche post-transmission",
};

type AboveThresholdCellProps = {
	dropoffRate: number;
};

function AboveThresholdCell({ dropoffRate }: AboveThresholdCellProps) {
	if (!isDropoffRateAboveThreshold(dropoffRate)) {
		return <td>Non</td>;
	}
	return (
		<td className="fr-text--bold">
			<span aria-hidden="true">{DROPOFF_ALERT_MARK}</span> Oui
		</td>
	);
}

/**
 * Accessible alternative to `<StepDropoffChart>` — same K5 dataset rendered
 * as a DSFR table inside a `<details>` toggle. Required for RGAA because
 * the Recharts SVG is not navigable by assistive tech.
 */
export function StepDropoffTable({ rows }: Props) {
	if (rows.length === 0) {
		return null;
	}

	const thresholdHeader = `Au-dessus du seuil de ${formatWholePercentage(DROPOFF_RATE_ALERT_THRESHOLD)}`;
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
									: étapes du wizard A–F puis phases post-transmission. La
									dernière colonne signale les phases dont le taux d'abandon
									dépasse le seuil d'alerte.
								</caption>
								<thead>
									<tr>
										<th scope="col">Phase</th>
										<th scope="col">Taux d'abandon (%)</th>
										<th scope="col">Abandonnées</th>
										<th scope="col">
											Total déclarations entrées dans la phase
										</th>
										<th scope="col">{thresholdHeader}</th>
									</tr>
								</thead>
								{wizardRows.length > 0 && (
									<tbody>
										<tr>
											<th
												className="fr-text--bold fr-background-alt--blue-france"
												colSpan={5}
												scope="rowgroup"
											>
												{PHASE_HEADERS.wizard}
											</th>
										</tr>
										{wizardRows.map((row) => (
											<tr key={row.key}>
												<th scope="row">{row.label}</th>
												<td>{formatFixedPercentage(row.dropoffRate)}</td>
												<td>{formatCount(row.abandoned)}</td>
												<td>{formatCount(row.total)}</td>
												<AboveThresholdCell dropoffRate={row.dropoffRate} />
											</tr>
										))}
									</tbody>
								)}
								{postSubmitRows.length > 0 && (
									<tbody>
										<tr>
											<th
												className="fr-text--bold fr-background-alt--red-marianne"
												colSpan={5}
												scope="rowgroup"
											>
												{PHASE_HEADERS.post_submit}
											</th>
										</tr>
										{postSubmitRows.map((row) => (
											<tr key={row.key}>
												<th scope="row">{row.label}</th>
												<td>{formatFixedPercentage(row.dropoffRate)}</td>
												<td>{formatCount(row.abandoned)}</td>
												<td>{formatCount(row.total)}</td>
												<AboveThresholdCell dropoffRate={row.dropoffRate} />
											</tr>
										))}
									</tbody>
								)}
							</table>
						</div>
					</div>
				</div>
			</div>
		</details>
	);
}

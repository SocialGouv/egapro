import type { StepDurationRow } from "./types";

type Props = {
	rows: StepDurationRow[];
};

function formatDays(value: number | null): string {
	if (value === null) return "—";
	return value.toLocaleString("fr-FR", {
		maximumFractionDigits: 1,
		minimumFractionDigits: 1,
	});
}

const PHASE_HEADERS: Record<StepDurationRow["phase"], string> = {
	wizard: "Parcours initial (wizard A–F)",
	post_submit: "Démarche post-soumission",
};

/**
 * Accessible alternative to `<StepDurationsChart>` — same K4 dataset rendered
 * as a DSFR table inside a `<details>` toggle. Required for RGAA because the
 * Recharts SVG is not navigable by assistive tech.
 */
export function StepDurationsTable({ rows }: Props) {
	if (rows.length === 0) {
		return null;
	}

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
									indicateurs et par jalon de la démarche post-soumission, et
									nombre de déclarations concernées.
								</caption>
								<thead>
									<tr>
										<th scope="col">Étape ou jalon</th>
										<th scope="col">Médiane (j)</th>
										<th scope="col">p90 (j)</th>
										<th scope="col">Échantillon</th>
									</tr>
								</thead>
								{wizardRows.length > 0 && (
									<tbody>
										<tr>
											<th
												className="fr-text--bold fr-background-alt--blue-france"
												colSpan={4}
												scope="rowgroup"
											>
												{PHASE_HEADERS.wizard}
											</th>
										</tr>
										{wizardRows.map((row) => (
											<tr key={row.key}>
												<th scope="row">{row.label}</th>
												<td>{formatDays(row.medianDays)}</td>
												<td>{formatDays(row.p90Days)}</td>
												<td>{row.sampleSize.toLocaleString("fr-FR")}</td>
											</tr>
										))}
									</tbody>
								)}
								{postSubmitRows.length > 0 && (
									<tbody>
										<tr>
											<th
												className="fr-text--bold fr-background-alt--red-marianne"
												colSpan={4}
												scope="rowgroup"
											>
												{PHASE_HEADERS.post_submit}
											</th>
										</tr>
										{postSubmitRows.map((row) => (
											<tr key={row.key}>
												<th scope="row">{row.label}</th>
												<td>{formatDays(row.medianDays)}</td>
												<td>{formatDays(row.p90Days)}</td>
												<td>{row.sampleSize.toLocaleString("fr-FR")}</td>
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

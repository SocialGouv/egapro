import {
	formatCount,
	formatShortDateTime,
	MISSING_VALUE,
} from "~/modules/domain";
import { DsfrTable } from "~/modules/shared/DsfrTable";

import { INCIDENT_LIMIT, INCIDENT_WINDOW_DAYS } from "./shared/constants";
import { statusLabel } from "./shared/statusLabels";
import type { ServiceIncident } from "./types";

type Props = {
	incidents: readonly ServiceIncident[];
};

export function IncidentList({ incidents }: Props) {
	return (
		<section aria-labelledby="service-status-incidents">
			<h2 className="fr-h2" id="service-status-incidents">
				Incidents des {formatCount(INCIDENT_WINDOW_DAYS)} derniers jours
			</h2>
			{incidents.length === 0 ? (
				<p>
					Aucun incident enregistré sur les {formatCount(INCIDENT_WINDOW_DAYS)}{" "}
					derniers jours.
				</p>
			) : (
				<>
					{incidents.length >= INCIDENT_LIMIT && (
						<p className="fr-text--sm fr-text-mention--grey">
							Seuls les {formatCount(INCIDENT_LIMIT)} incidents les plus récents
							sont affichés.
						</p>
					)}
					<DsfrTable
						caption={`Incidents des ${formatCount(INCIDENT_WINDOW_DAYS)} derniers jours, du plus récent au plus ancien.`}
						className="fr-mb-0"
					>
						<thead>
							<tr>
								<th scope="col">Sonde</th>
								<th scope="col">Évolution</th>
								<th scope="col">Début</th>
								<th scope="col">Fin</th>
								<th scope="col">Dernier message</th>
							</tr>
						</thead>
						<tbody>
							{incidents.map((incident) => (
								<tr key={incident.id}>
									<td>{incident.probeLabel}</td>
									<td>
										{statusLabel(incident.fromStatus)} →{" "}
										{statusLabel(incident.toStatus)}
									</td>
									<td>{formatShortDateTime(incident.startedAt)}</td>
									<td>
										{incident.endedAt
											? formatShortDateTime(incident.endedAt)
											: "En cours"}
									</td>
									<td>{incident.lastError ?? MISSING_VALUE}</td>
								</tr>
							))}
						</tbody>
					</DsfrTable>
				</>
			)}
		</section>
	);
}

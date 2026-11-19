import {
	formatElapsedDuration,
	formatLatency,
	formatShortDateTime,
	MISSING_VALUE,
} from "~/modules/domain";
import { DsfrTable } from "~/modules/shared/DsfrTable";

import {
	criticalityLabel,
	statusBadgeClass,
	statusLabel,
} from "./shared/statusLabels";
import type { ServiceProbe } from "./types";

type Props = {
	probes: readonly ServiceProbe[];
	referenceTime: Date;
};

export function ProbeTable({ probes, referenceTime }: Props) {
	return (
		<section aria-labelledby="service-status-probes" className="fr-mb-6w">
			<h2 className="fr-h2" id="service-status-probes">
				Services
			</h2>
			<DsfrTable
				caption="Sondes de service : criticité, état, dernière vérification, latence, ancienneté de l'état et dernier message d'erreur."
				className="fr-mb-0"
			>
				<thead>
					<tr>
						<th scope="col">Service</th>
						<th scope="col">Criticité</th>
						<th scope="col">État</th>
						<th scope="col">Dernière vérification</th>
						<th scope="col">Latence</th>
						<th scope="col">Depuis</th>
						<th scope="col">Dernier message</th>
					</tr>
				</thead>
				<tbody>
					{probes.length === 0 && (
						<tr>
							<td colSpan={7}>Aucune sonde de service enregistrée.</td>
						</tr>
					)}
					{probes.map((probe) => (
						<tr key={probe.key}>
							<td>{probe.label}</td>
							<td>{criticalityLabel(probe.criticality)}</td>
							<td>
								<span
									className={`fr-badge fr-badge--sm fr-badge--no-icon ${statusBadgeClass(probe.status)}`}
								>
									{statusLabel(probe.status)}
								</span>
							</td>
							<td>{formatShortDateTime(probe.checkedAt)}</td>
							<td>{formatLatency(probe.latencyMs)}</td>
							<td>
								{formatElapsedDuration(
									referenceTime.getTime() - probe.changedAt.getTime(),
								)}
							</td>
							<td>{probe.lastError ?? MISSING_VALUE}</td>
						</tr>
					))}
				</tbody>
			</DsfrTable>
		</section>
	);
}

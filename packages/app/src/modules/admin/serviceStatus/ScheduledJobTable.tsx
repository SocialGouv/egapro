import { formatShortDateTime, MISSING_VALUE } from "~/modules/domain";
import { DsfrTable } from "~/modules/shared/DsfrTable";

import {
	criticalityLabel,
	jobStatusLabel,
	statusBadgeClass,
} from "./shared/statusLabels";
import type { ScheduledJob } from "./types";

type Props = {
	jobs: readonly ScheduledJob[];
};

export function ScheduledJobTable({ jobs }: Props) {
	return (
		<section aria-labelledby="service-status-jobs" className="fr-mb-6w">
			<h2 className="fr-h2" id="service-status-jobs">
				Traitements planifiés
			</h2>
			<DsfrTable
				caption="Traitements planifiés : criticité, état, dernier succès, dernier échec, prochaine exécution attendue et dernier message d'erreur."
				className="fr-mb-0"
			>
				<thead>
					<tr>
						<th scope="col">Traitement</th>
						<th scope="col">Criticité</th>
						<th scope="col">État</th>
						<th scope="col">Dernier succès</th>
						<th scope="col">Dernier échec</th>
						<th scope="col">Prochaine exécution attendue</th>
						<th scope="col">Dernier message</th>
					</tr>
				</thead>
				<tbody>
					{jobs.length === 0 && (
						<tr>
							<td colSpan={7}>Aucun traitement planifié enregistré.</td>
						</tr>
					)}
					{jobs.map((job) => (
						<tr key={job.key}>
							<td>{job.label}</td>
							<td>{criticalityLabel(job.criticality)}</td>
							<td>
								<span
									className={`fr-badge fr-badge--sm fr-badge--no-icon ${statusBadgeClass(job.status)}`}
								>
									{jobStatusLabel(job.status)}
								</span>
							</td>
							<td>{formatShortDateTime(job.lastSuccessAt)}</td>
							<td>{formatShortDateTime(job.lastFailureAt)}</td>
							<td>{formatShortDateTime(job.nextExpectedAt)}</td>
							<td>{job.lastError ?? MISSING_VALUE}</td>
						</tr>
					))}
				</tbody>
			</DsfrTable>
		</section>
	);
}

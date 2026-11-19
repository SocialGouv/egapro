"use client";

import { formatTime } from "~/modules/domain";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { api } from "~/trpc/react";

import { IncidentList } from "./IncidentList";
import { ProbeTable } from "./ProbeTable";
import { ScheduledJobTable } from "./ScheduledJobTable";
import { ServiceStatusSummary } from "./ServiceStatusSummary";

const REFRESH_INTERVAL_MS = 30_000;

export function ServiceStatusPage() {
	const { data, error, isLoading, dataUpdatedAt } =
		api.adminStatus.getOverview.useQuery(undefined, {
			refetchInterval: REFRESH_INTERVAL_MS,
		});

	return (
		<>
			<h1 className="fr-h1">État des services</h1>
			{isLoading && <p role="status">Chargement de l'état des services…</p>}
			{error && !isLoading && (
				<div className="fr-alert fr-alert--error" role="alert">
					<p>L'état des services n'a pas pu être chargé.</p>
					{data && (
						<p className="fr-mb-0">
							Les valeurs affichées sont celles de la dernière relève réussie.
						</p>
					)}
				</div>
			)}
			{data && (
				<>
					<p
						aria-atomic="true"
						aria-live="polite"
						className="fr-text--sm fr-text-mention--grey"
					>
						État actualisé à {formatTime(new Date(dataUpdatedAt))}.
					</p>
					<ServiceStatusSummary
						lastCheckedAt={data.lastCheckedAt}
						summary={data.summary}
					/>
					{data.grafanaUrl && (
						<p className="fr-mb-6w">
							<a
								className="fr-link fr-icon-external-link-line fr-link--icon-right"
								href={data.grafanaUrl}
								rel="noopener noreferrer"
								target="_blank"
							>
								Tableaux de bord Grafana
								<NewTabNotice />
							</a>
						</p>
					)}
					<ProbeTable probes={data.probes} referenceTime={data.generatedAt} />
					<ScheduledJobTable jobs={data.jobs} />
					<IncidentList incidents={data.incidents} />
				</>
			)}
		</>
	);
}

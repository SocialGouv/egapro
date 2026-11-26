import { formatShortDateTime } from "~/modules/domain";

import { summarySentence } from "./shared/statusLabels";
import type { ServiceStatusOverviewSummary } from "./types";

const TONE_CLASSES: Record<ServiceStatusOverviewSummary["tone"], string> = {
	success: "fr-alert--success",
	warning: "fr-alert--warning",
	error: "fr-alert--error",
};

type Props = {
	summary: ServiceStatusOverviewSummary;
	lastCheckedAt: Date | null;
};

export function ServiceStatusSummary({ summary, lastCheckedAt }: Props) {
	return (
		<section aria-labelledby="service-status-summary" className="fr-mb-6w">
			<h2 className="fr-h2" id="service-status-summary">
				Synthèse
			</h2>
			<div className={`fr-alert ${TONE_CLASSES[summary.tone]}`}>
				<p className="fr-alert__title">{summarySentence(summary)}</p>
				<p className="fr-mb-0">
					Dernière relève du sondeur : {formatShortDateTime(lastCheckedAt)}.
				</p>
			</div>
		</section>
	);
}

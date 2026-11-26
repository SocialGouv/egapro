import Link from "next/link";

import { ADMIN_SERVICE_STATUS } from "~/modules/routes";

import { bannerBody, bannerTitle } from "./shared/statusLabels";
import type { ServiceStatusOverviewSummary } from "./types";

type Props = {
	summary: ServiceStatusOverviewSummary;
};

export function ServiceStatusBanner({ summary }: Props) {
	if (!summary.bannerVisible) return null;

	return (
		<section
			aria-labelledby="service-status-banner"
			className={`fr-alert fr-alert--${summary.tone} fr-mb-4w`}
		>
			<p className="fr-alert__title" id="service-status-banner">
				{bannerTitle(summary)}
			</p>
			<p>{bannerBody(summary)}</p>
			<p className="fr-mb-0">
				<Link className="fr-link" href={ADMIN_SERVICE_STATUS}>
					Consulter l'état des services
				</Link>
			</p>
		</section>
	);
}

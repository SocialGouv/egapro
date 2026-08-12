"use client";

import { DownloadStatusRegion } from "./DownloadStatusRegion";
import { useDownloadClickGuard } from "./useDownloadClickGuard";

const PENDING_LABEL = "Téléchargement en cours…";

type Props = {
	dataYear: number;
	href: string;
	title: string;
	year: number;
};

export function DownloadCard({ dataYear, href, title, year }: Props) {
	const { anchorProps, state } = useDownloadClickGuard(href);

	return (
		<>
			{/* SM, per the Figma node "Carte / Thème clair / Desktop / SM / Sans
			    média": 24px padding, 20/28 title, 8px under it. The default size
			    gives 32px, 22px and 12px. */}
			<div className="fr-card fr-card--sm fr-card--download fr-enlarge-link">
				<div className="fr-card__body">
					<div className="fr-card__content">
						<h3 className="fr-card__title">
							<a download {...anchorProps}>
								{state === "pending" ? PENDING_LABEL : title}
							</a>
						</h3>
						<p className="fr-card__desc">
							Année {year} au titre des données {dataYear}
						</p>
						<div className="fr-card__end">
							{/* The PDF is generated on demand, so only the format is known. */}
							<p className="fr-card__detail">PDF</p>
						</div>
					</div>
				</div>
			</div>
			<DownloadStatusRegion pendingLabel={PENDING_LABEL} state={state} />
		</>
	);
}

"use client";

import { DownloadStatusRegion, useDownloadClickGuard } from "~/modules/shared";

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
			<div className="fr-card fr-card--download fr-enlarge-link">
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

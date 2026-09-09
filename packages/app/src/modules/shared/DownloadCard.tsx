"use client";

import { DownloadStatusRegion } from "./DownloadStatusRegion";
import { FileFormatDetail } from "./FileFormatDetail";
import { useDownloadClickGuard } from "./useDownloadClickGuard";

const PENDING_LABEL = "Téléchargement en cours…";

export function formatDocumentSubtitle(year: number, dataYear: number): string {
	return `Année ${year} au titre des données ${dataYear}`;
}

type Props = {
	description: string;
	href: string;
	title: string;
};

export function DownloadCard({ description, href, title }: Props) {
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
						<p className="fr-card__desc">{description}</p>
						<div className="fr-card__end">
							<p className="fr-card__detail">
								<FileFormatDetail href={href} />
							</p>
						</div>
					</div>
				</div>
			</div>
			<DownloadStatusRegion pendingLabel={PENDING_LABEL} state={state} />
		</>
	);
}

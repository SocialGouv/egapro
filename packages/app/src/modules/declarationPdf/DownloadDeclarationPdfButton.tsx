"use client";

import {
	campaignYearDimension,
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
import { FileDownloadLink } from "~/modules/shared";

type Props = {
	year?: number;
	correction?: boolean;
	variant?: "secondary" | "tertiary";
	label?: string;
};

export function DownloadDeclarationPdfButton({
	year,
	correction,
	variant = "secondary",
	label = "Télécharger le récapitulatif (PDF)",
}: Props) {
	const params = new URLSearchParams();
	if (year) params.set("year", String(year));
	if (correction) params.set("type", "correction");
	const query = params.toString();
	const href = query ? `/api/declaration-pdf?${query}` : "/api/declaration-pdf";

	function handleBeforeDownload(): void {
		trackEvent({
			category: MATOMO_EVENT_CATEGORY.DOCUMENT,
			action: MATOMO_ACTION.PDF_DOWNLOAD,
			name: correction ? "correction" : "main",
			dimensions: year ? campaignYearDimension(year) : undefined,
		});
	}

	return (
		<FileDownloadLink
			className={`fr-btn fr-btn--${variant} fr-btn--icon-left fr-icon-file-pdf-line`}
			href={href}
			onBeforeDownload={handleBeforeDownload}
			pendingLabel="Génération du récapitulatif en cours…"
		>
			{label}
		</FileDownloadLink>
	);
}

"use client";

import { DownloadStatusRegion } from "./DownloadStatusRegion";
import { useDownloadClickGuard } from "./useDownloadClickGuard";

type Props = {
	href: string;
	className?: string;
	pendingLabel?: string;
	onBeforeDownload?: () => void;
	children: React.ReactNode;
};

export function FileDownloadLink({
	href,
	className,
	pendingLabel = "Téléchargement en cours…",
	onBeforeDownload,
	children,
}: Props) {
	const { anchorProps, state } = useDownloadClickGuard(href, onBeforeDownload);

	return (
		<>
			<a className={className} {...anchorProps}>
				{state === "pending" ? pendingLabel : children}
			</a>
			<DownloadStatusRegion pendingLabel={pendingLabel} state={state} />
		</>
	);
}

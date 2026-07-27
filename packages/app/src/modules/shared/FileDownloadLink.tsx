"use client";

import { useState } from "react";

type DownloadState = "idle" | "pending" | "error";

export function useFileDownload() {
	const [state, setState] = useState<DownloadState>("idle");

	async function download(href: string): Promise<void> {
		if (state === "pending") return;
		setState("pending");
		try {
			const response = await fetch(href);
			if (!response.ok) {
				setState("error");
				return;
			}
			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);
			const disposition = response.headers.get("Content-Disposition");
			let filename = "";
			if (disposition) {
				const utf8Match = /filename\*=UTF-8''([^;\r\n]+)/i.exec(disposition);
				const asciiMatch = /filename=["']?([^"';\r\n]+)["']?/i.exec(
					disposition,
				);
				const raw = utf8Match?.[1] ?? asciiMatch?.[1];
				if (raw) filename = decodeURIComponent(raw.trim());
			}
			const anchor = document.createElement("a");
			anchor.href = objectUrl;
			if (filename) anchor.download = filename;
			anchor.click();
			URL.revokeObjectURL(objectUrl);
			setState("idle");
		} catch {
			setState("error");
		}
	}

	return { state, download };
}

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
	const { state, download } = useFileDownload();

	return (
		<>
			<a
				aria-busy={state === "pending" ? "true" : undefined}
				aria-disabled={state === "pending" ? "true" : undefined}
				className={className}
				href={href}
				onClick={(e) => {
					e.preventDefault();
					onBeforeDownload?.();
					void download(href);
				}}
			>
				{state === "pending" ? pendingLabel : children}
			</a>
			<p aria-atomic="true" aria-live="polite" className="fr-sr-only">
				{state === "pending" ? pendingLabel : ""}
			</p>
			{state === "error" && (
				<p className="fr-text--xs fr-error-text fr-mt-1w fr-mb-0" role="alert">
					Le téléchargement a échoué, réessayez.
				</p>
			)}
		</>
	);
}

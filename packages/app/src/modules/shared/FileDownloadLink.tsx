"use client";

import { useRef, useState } from "react";

type DownloadState = "idle" | "pending" | "error";

// Browsers cancel a download whose blob URL is revoked too early. Keep the
// URL alive long enough for the click to be picked up by the download
// manager, then release the memory.
const OBJECT_URL_TTL_MS = 60_000;

export function useFileDownload() {
	const [state, setState] = useState<DownloadState>("idle");
	// Guards against a burst of clicks fired before React re-renders with the
	// pending state — the very behaviour this component exists to fix.
	const isDownloading = useRef(false);

	async function download(href: string): Promise<void> {
		if (isDownloading.current) return;
		isDownloading.current = true;
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
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			setTimeout(() => URL.revokeObjectURL(objectUrl), OBJECT_URL_TTL_MS);
			setState("idle");
		} catch {
			setState("error");
		} finally {
			isDownloading.current = false;
		}
	}

	return { state, download };
}

/**
 * A modifier click ("open in a new tab", "save as") must keep the browser's
 * native behaviour — hijacking it would be a regression on the plain link.
 */
export function isNativeClick(event: React.MouseEvent): boolean {
	return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
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
					if (isNativeClick(e)) return;
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

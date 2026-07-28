"use client";

import { type MouseEvent as ReactMouseEvent, useRef, useState } from "react";

export type DownloadState = "idle" | "pending" | "error";

// Browsers cancel a download whose blob URL is revoked before the download
// manager has picked the click up.
const OBJECT_URL_TTL_MS = 60_000;

// A modifier click ("open in a new tab", "save as") must keep its native behaviour.
export function isNativeClick(event: ReactMouseEvent): boolean {
	return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function readFilename(disposition: string | null): string {
	if (!disposition) return "";
	const utf8Match = /filename\*=UTF-8''([^;\r\n]+)/i.exec(disposition);
	const asciiMatch = /filename=["']?([^"';\r\n]+)["']?/i.exec(disposition);
	const raw = utf8Match?.[1] ?? asciiMatch?.[1];
	return raw ? decodeURIComponent(raw.trim()) : "";
}

type AnchorProps = {
	"aria-busy": "true" | undefined;
	"aria-disabled": "true" | undefined;
	href: string;
	onClick: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
};

/**
 * Turns a plain download link into a guarded one: the first click fetches the
 * file and swaps the anchor to a busy state, and every click fired while that
 * request is in flight is ignored instead of starting a second generation.
 */
export function useDownloadClickGuard(
	href: string,
	onBeforeDownload?: () => void,
): { anchorProps: AnchorProps; state: DownloadState } {
	const [state, setState] = useState<DownloadState>("idle");
	// A ref, not the state: a burst of clicks lands before React re-renders.
	const isDownloading = useRef(false);

	async function download(): Promise<void> {
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
			const filename = readFilename(
				response.headers.get("Content-Disposition"),
			);
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

	return {
		anchorProps: {
			"aria-busy": state === "pending" ? "true" : undefined,
			"aria-disabled": state === "pending" ? "true" : undefined,
			href,
			onClick: (event) => {
				if (isNativeClick(event)) return;
				event.preventDefault();
				onBeforeDownload?.();
				void download();
			},
		},
		state,
	};
}

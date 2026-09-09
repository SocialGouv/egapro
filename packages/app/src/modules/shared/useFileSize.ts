"use client";

import { useEffect, useState } from "react";

/**
 * Probes a download route with `HEAD` and reads `Content-Length`. Returns null
 * while the probe is in flight, and stays null on any failure — a missing size
 * is displayed by omitting it, never as an error.
 */
export function useFileSize(href: string): number | null {
	const [size, setSize] = useState<number | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		setSize(null);

		fetch(href, { method: "HEAD", signal: controller.signal })
			.then((response) => {
				if (!response.ok) return;
				const header = response.headers.get("content-length");
				if (header === null) return;
				const parsed = Number.parseInt(header, 10);
				// Zero means a layer rebuilt the entity headers on the bodyless
				// response, not that the PDF is empty. Showing « PDF – 0 Ko » would
				// be worse than showing nothing.
				if (!Number.isFinite(parsed) || parsed <= 0) return;
				setSize(parsed);
			})
			.catch(() => undefined);

		return () => controller.abort();
	}, [href]);

	return size;
}

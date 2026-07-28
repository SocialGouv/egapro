import { vi } from "vitest";

/**
 * Fetch stubs and DOM queries shared by every guarded-download test suite
 * (useDownloadClickGuard, DownloadStatusRegion, FileDownloadLink, DownloadCard,
 * DocumentsPanel). Kept in one place so the live-region markup and the PDF
 * response shape have a single definition across the five files.
 */

/** A PDF response, optionally carrying a `Content-Disposition` header. */
export function pdfResponse(
	disposition?: string,
	{ ok = true }: { ok?: boolean } = {},
): Response {
	return {
		ok,
		blob: () => Promise.resolve(new Blob(["pdf"], { type: "application/pdf" })),
		headers: {
			get: (name: string) =>
				name.toLowerCase() === "content-disposition"
					? (disposition ?? null)
					: null,
		},
	} as unknown as Response;
}

/** A fetch that never settles — pins the download to its pending state. */
export function pendingFetch() {
	return vi.fn(() => new Promise<Response>(() => undefined));
}

/** A fetch resolving to a non-ok response. */
export function failingFetch() {
	return vi.fn(() => Promise.resolve(pdfResponse(undefined, { ok: false })));
}

/**
 * The polite live region rendered by `DownloadStatusRegion`. It carries no
 * `role` on purpose (RGAA forbids declaring both), so it cannot be reached
 * through a role query.
 */
export function getLiveRegion(scope: ParentNode): HTMLElement | null {
	return scope.querySelector('[aria-live="polite"]');
}

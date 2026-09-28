import { vi } from "vitest";

/**
 * Fetch stubs and DOM queries shared by every guarded-download test suite
 * (useDownloadClickGuard, DownloadStatusRegion, FileDownloadLink, DownloadCard,
 * DocumentsPanel). Kept in one place so the live-region markup and the PDF
 * response shape have a single definition across the five files.
 */

type PdfResponseOptions = {
	ok?: boolean;
	contentLength?: number | null;
};

/** A PDF response, optionally carrying `Content-Disposition` and a size. */
export function pdfResponse(
	disposition?: string,
	{ ok = true, contentLength = null }: PdfResponseOptions = {},
): Response {
	return {
		ok,
		blob: () => Promise.resolve(new Blob(["pdf"], { type: "application/pdf" })),
		text: () => Promise.resolve(""),
		headers: {
			get: (name: string) => {
				const header = name.toLowerCase();
				if (header === "content-disposition") return disposition ?? null;
				if (header === "content-length") {
					return contentLength === null ? null : String(contentLength);
				}
				return null;
			},
		},
	} as unknown as Response;
}

/**
 * A fetch answering the `HEAD` size probe with `contentLength` and any other
 * verb with a downloadable PDF. Downloads stay pending so a suite that only
 * cares about the size never has to unwind a click.
 */
export function sizeProbeFetch(contentLength: number | null) {
	return vi.fn((_href: string, init?: RequestInit) => {
		if (init?.method === "HEAD") {
			return Promise.resolve(pdfResponse(undefined, { contentLength }));
		}
		return new Promise<Response>(() => undefined);
	});
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

/** The calls a fetch stub received for an actual download, excluding size probes. */
export function downloadCalls(fetchMock: {
	mock: { calls: unknown[][] };
}): unknown[][] {
	return fetchMock.mock.calls.filter(
		(call) => (call[1] as RequestInit | undefined)?.method !== "HEAD",
	);
}

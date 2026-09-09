import "server-only";

import { createHash } from "node:crypto";

const MAX_ENTRIES = 200;

const renderedSizes = new Map<string, number>();

// Keyed on the PDF's own data rather than on a timestamp, so a change to the
// declaration, to the deadlines or to the document content invalidates the
// entry on its own and a stale size can never be served.
export function pdfSizeKey(route: string, data: unknown): string {
	const fingerprint = createHash("sha256")
		.update(JSON.stringify(data) ?? "")
		.digest("hex");
	return `${route}:${fingerprint}`;
}

export function getPdfSize(key: string): number | null {
	const size = renderedSizes.get(key);
	if (size === undefined) return null;
	renderedSizes.delete(key);
	renderedSizes.set(key, size);
	return size;
}

export function setPdfSize(key: string, size: number): void {
	renderedSizes.delete(key);
	renderedSizes.set(key, size);
	while (renderedSizes.size > MAX_ENTRIES) {
		const oldest = renderedSizes.keys().next().value;
		if (oldest === undefined) break;
		renderedSizes.delete(oldest);
	}
}

export function clearPdfSizeCache(): void {
	renderedSizes.clear();
}

export const PDF_SIZE_CACHE_MAX_ENTRIES = MAX_ENTRIES;

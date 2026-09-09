import "server-only";

import { createHash } from "node:crypto";

const MAX_ENTRIES = 200;

const renderedSizes = new Map<string, number>();

// The moment the document was produced is not part of what it says, and it is
// the one field that differs on every single call — `buildRepresentationPdfData`
// returns a raw `Date`, which serialises to the millisecond. Left in the
// fingerprint it gives every request its own key: the cache would never be read
// and every probe would render a full PDF. Neutralised here rather than at the
// call sites so the GET and the HEAD cannot drift apart.
const GENERATION_TIMESTAMP_KEY = "generatedAt";

export function pdfSizeKey(route: string, data: unknown): string {
	const stable = JSON.stringify(data, (key, value) =>
		key === GENERATION_TIMESTAMP_KEY ? null : value,
	);
	const fingerprint = createHash("sha256")
		.update(stable ?? "")
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

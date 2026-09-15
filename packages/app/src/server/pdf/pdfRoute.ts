import "server-only";

import { getPdfSize, pdfSizeKey, setPdfSize } from "./pdfSizeCache";

type RenderPdf = () => Promise<Buffer>;

export function pdfHeaders(
	filename: string,
	byteLength: number,
): Record<string, string> {
	return {
		"Content-Type": "application/pdf",
		"Content-Disposition": `attachment; filename="${filename}"`,
		"Content-Length": String(byteLength),
	};
}

export async function renderPdfAndCacheSize(
	route: string,
	data: unknown,
	render: RenderPdf,
): Promise<Uint8Array<ArrayBuffer>> {
	const buffer = await render();
	setPdfSize(pdfSizeKey(route, data), buffer.byteLength);
	return new Uint8Array(buffer);
}

// The GET pays the render and fills the cache, so a probe that follows a
// download is free; the first probe on fresh data has to render to answer.
export async function resolvePdfSize(
	route: string,
	data: unknown,
	render: RenderPdf,
): Promise<number> {
	const key = pdfSizeKey(route, data);
	const cached = getPdfSize(key);
	if (cached !== null) return cached;

	const buffer = await render();
	setPdfSize(key, buffer.byteLength);
	return buffer.byteLength;
}

import "server-only";

import { parseCampaignYear } from "~/modules/domain";
import type { QueryParseResult } from "~/server/audit/queryMetadata";
import { getPdfSize, pdfSizeKey, setPdfSize } from "./pdfSizeCache";

type RenderPdf = () => Promise<Buffer>;

const NO_STORE = "private, no-store";

// Shaped like a Zod `safeParse` so the audit row goes through `auditQueryMetadata`.
export function parseRequestedYear(
	request: Request,
): QueryParseResult<{ year: number | null }> {
	const raw = new URL(request.url).searchParams.get("year");
	if (!raw) {
		return { success: true, data: { year: null } };
	}
	const year = parseCampaignYear(raw);
	return year === null
		? { success: false, error: { issues: [{ path: ["year"] }] } }
		: { success: true, data: { year } };
}

export function pdfErrorResponse(
	body: string | null,
	status: number,
): Response {
	return new Response(body, {
		status,
		headers: { "Cache-Control": NO_STORE },
	});
}

export function invalidYearResponse(): Response {
	return pdfErrorResponse("Paramètre 'year' invalide", 400);
}

export function pdfHeaders(
	filename: string,
	byteLength: number,
): Record<string, string> {
	return {
		"Content-Type": "application/pdf",
		"Content-Disposition": `attachment; filename="${filename}"`,
		"Content-Length": String(byteLength),
		"Cache-Control": NO_STORE,
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

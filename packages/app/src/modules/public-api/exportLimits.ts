import { formatCount } from "~/modules/domain";
import { PUBLIC_API_EXPORT_HEADERS } from "./httpHeaders";

type PublicExportFormat = "json" | "csv" | "xlsx";

export const MAX_XLSX_EXPORT_ROWS = 10_000;

// Sized for the unfiltered open-data export: see docs/PUBLIC-API.md, « Plafonds, cache et calculs simultanés ».
export const MAX_EXPORT_ROWS = 200_000;

export const MAX_CONCURRENT_PUBLIC_EXPORTS = 2;

export const PUBLIC_EXPORT_RETRY_AFTER_SECONDS = 30;

export const PUBLIC_EXPORT_BUSY_MESSAGE =
	"Trop d’exports sont en cours de calcul. Réessayez dans quelques instants.";

function exportRowLimit(format: PublicExportFormat): number {
	return format === "xlsx" ? MAX_XLSX_EXPORT_ROWS : MAX_EXPORT_ROWS;
}

function exportTooLargeMessage(format: PublicExportFormat): string {
	return format === "xlsx"
		? `L’export Excel est limité à ${formatCount(MAX_XLSX_EXPORT_ROWS)} lignes. Ajoutez des filtres ou utilisez le format CSV.`
		: `L’export est limité à ${formatCount(MAX_EXPORT_ROWS)} lignes. Ajoutez des filtres, par exemple une année avec le paramètre year.`;
}

function exportTooLargeResponse(format: PublicExportFormat): Response {
	return Response.json(
		{ error: exportTooLargeMessage(format) },
		{ status: 413, headers: PUBLIC_API_EXPORT_HEADERS },
	);
}

// One row past the cap detects an oversized result; `probeRows` lets the caller do it on a lighter projection.
export async function fetchWithinExportLimit<Row>(
	format: PublicExportFormat,
	fetchRows: (limit: number) => Promise<Row[]>,
	probeRows?: (limit: number) => Promise<unknown[]>,
): Promise<Row[] | Response> {
	const limit = exportRowLimit(format);
	if (!probeRows) {
		const rows = await fetchRows(limit + 1);
		return rows.length > limit ? exportTooLargeResponse(format) : rows;
	}
	const probed = await probeRows(limit + 1);
	return probed.length > limit
		? exportTooLargeResponse(format)
		: fetchRows(limit);
}

export function publicExportBusyResponse(): Response {
	return Response.json(
		{ error: PUBLIC_EXPORT_BUSY_MESSAGE },
		{
			status: 503,
			headers: {
				...PUBLIC_API_EXPORT_HEADERS,
				"Cache-Control": "no-store",
				"Retry-After": String(PUBLIC_EXPORT_RETRY_AFTER_SECONDS),
			},
		},
	);
}

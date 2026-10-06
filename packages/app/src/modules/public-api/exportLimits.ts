import { formatCount } from "~/modules/domain";
import { PUBLIC_API_EXPORT_HEADERS } from "./httpHeaders";

export type PublicExportFormat = "json" | "csv" | "xlsx";

/** An Excel workbook is assembled in memory cell by cell: far below the text formats. */
export const MAX_XLSX_EXPORT_ROWS = 10_000;

/**
 * Safety ceiling of the JSON and CSV exports, which stay unfiltered for the
 * data.gouv.fr resource and the "tout télécharger" button. About 35 000
 * companies declare per campaign and the exports span every published
 * campaign since 2027: this leaves five campaigns of headroom while bounding
 * what one request may hold in memory.
 */
export const MAX_EXPORT_ROWS = 200_000;

function exportRowLimit(format: PublicExportFormat): number {
	return format === "xlsx" ? MAX_XLSX_EXPORT_ROWS : MAX_EXPORT_ROWS;
}

function exportTooLargeMessage(format: PublicExportFormat): string {
	return format === "xlsx"
		? `L’export Excel est limité à ${formatCount(MAX_XLSX_EXPORT_ROWS)} lignes. Ajoutez des filtres ou utilisez le format CSV.`
		: `L’export est limité à ${formatCount(MAX_EXPORT_ROWS)} lignes. Ajoutez des filtres, par exemple une année avec le paramètre year.`;
}

/**
 * Fetches one row past the format's cap, so an oversized result is detected
 * without loading it, and answers 413 instead of the rows when it is exceeded.
 */
export async function fetchWithinExportLimit<Row>(
	format: PublicExportFormat,
	fetchRows: (limit: number) => Promise<Row[]>,
): Promise<Row[] | Response> {
	const limit = exportRowLimit(format);
	const rows = await fetchRows(limit + 1);
	if (rows.length <= limit) return rows;
	return Response.json(
		{ error: exportTooLargeMessage(format) },
		{ status: 413, headers: PUBLIC_API_EXPORT_HEADERS },
	);
}

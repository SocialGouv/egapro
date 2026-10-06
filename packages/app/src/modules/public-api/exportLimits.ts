import { formatCount } from "~/modules/domain";
import { PUBLIC_API_EXPORT_HEADERS } from "./httpHeaders";

export type PublicExportFormat = "json" | "csv" | "xlsx";

export const MAX_XLSX_EXPORT_ROWS = 10_000;

// Sized for the unfiltered open-data export: see docs/PUBLIC-API.md, « Plafonds et cache des exports ».
export const MAX_EXPORT_ROWS = 200_000;

function exportRowLimit(format: PublicExportFormat): number {
	return format === "xlsx" ? MAX_XLSX_EXPORT_ROWS : MAX_EXPORT_ROWS;
}

function exportTooLargeMessage(format: PublicExportFormat): string {
	return format === "xlsx"
		? `L’export Excel est limité à ${formatCount(MAX_XLSX_EXPORT_ROWS)} lignes. Ajoutez des filtres ou utilisez le format CSV.`
		: `L’export est limité à ${formatCount(MAX_EXPORT_ROWS)} lignes. Ajoutez des filtres, par exemple une année avec le paramètre year.`;
}

// One row past the cap detects an oversized result without loading it.
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

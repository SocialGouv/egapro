import "server-only";

import { eq } from "drizzle-orm";
import type { GipMdsRow } from "~/modules/declaration-remuneration/shared/gipMdsMapping";
import { CSV_TO_SCHEMA_MAP } from "~/modules/declaration-remuneration/shared/gipMdsMapping";
import type { DB } from "~/server/db";
import { gipMdsData } from "~/server/db/schema";

/**
 * CSV metadata extracted from the first 2 lines of a GIP MDS file.
 * Line 1: destinataire;projet;horodatage;date_debut;date_fin;nb_lignes
 * Line 2: values
 */
type CsvMetadata = {
	periodStart: string;
	periodEnd: string;
	expectedRows: number;
};

/**
 * Parse the GIP MDS CSV file content into structured rows.
 *
 * Format:
 * - Lines 1-2: metadata (header + values)
 * - Line 3: data column headers
 * - Lines 4+: data rows
 * - Separator: semicolon
 * - Decimal: French comma → converted to dot
 */
export function parseGipCsv(csvContent: string): {
	metadata: CsvMetadata;
	rows: Array<Partial<GipMdsRow>>;
} {
	const lines = csvContent.trim().split("\n");

	if (lines.length < 4) {
		throw new Error(
			"Invalid GIP CSV: expected at least 4 lines (2 metadata + header + 1 data row)",
		);
	}

	const metaValues = splitCsvLine(lines[1] ?? "");
	const metadata: CsvMetadata = {
		periodStart: metaValues[3] ?? "",
		periodEnd: metaValues[4] ?? "",
		expectedRows: Number.parseInt(metaValues[5] ?? "0", 10),
	};

	const headers = splitCsvLine(lines[2] ?? "").map((h) => h.trim());
	const rows: Array<Partial<GipMdsRow>> = [];

	for (let i = 3; i < lines.length; i++) {
		const line = lines[i];
		if (!line?.trim()) continue;

		const values = splitCsvLine(line);
		const row: Record<string, string> = {};

		for (let j = 0; j < headers.length; j++) {
			const header = headers[j];
			if (!header) continue;

			const schemaField = CSV_TO_SCHEMA_MAP[header];
			if (!schemaField) continue;

			const rawValue = values[j]?.trim() ?? "";
			if (rawValue === "") continue;

			// Convert French decimal comma to dot for numeric fields
			row[schemaField] = rawValue.replace(",", ".");
		}

		if (row.siren) {
			rows.push(row as unknown as Partial<GipMdsRow>);
		}
	}

	return { metadata, rows };
}

/** Split a semicolon-separated CSV line. */
function splitCsvLine(line: string): string[] {
	return line.split(";");
}

/**
 * Derive the reference year from the period end date (e.g. "2026-12-31" → 2026).
 */
function yearFromPeriodEnd(periodEnd: string): number {
	const parsed = Number.parseInt(periodEnd.slice(0, 4), 10);
	if (Number.isNaN(parsed)) {
		throw new Error(`Invalid period end date: ${periodEnd}`);
	}
	return parsed;
}

/**
 * Fetch a GIP MDS CSV file from a URL.
 */
export async function fetchGipCsv(url: string): Promise<string> {
	const response = await fetch(url, {
		signal: AbortSignal.timeout(30_000),
	});

	if (!response.ok) {
		throw new Error(
			`GIP MDS API error: ${response.status} ${response.statusText}`,
		);
	}

	return response.text();
}

/**
 * Import GIP MDS CSV content into the database.
 * Parses the CSV and upserts all rows for the given year.
 * Returns the number of rows imported.
 */
export async function importGipCsvToDb(
	db: DB,
	csvContent: string,
): Promise<{ year: number; rowCount: number }> {
	const { metadata, rows } = parseGipCsv(csvContent);
	const year = yearFromPeriodEnd(metadata.periodEnd);

	if (rows.length === 0) {
		return { year, rowCount: 0 };
	}

	// Delete existing data for this year before inserting
	await db.delete(gipMdsData).where(eq(gipMdsData.year, year));

	// Insert all rows with metadata
	await db.insert(gipMdsData).values(
		rows.map((row) => ({
			...row,
			year,
			periodStart: metadata.periodStart,
			periodEnd: metadata.periodEnd,
			siren: row.siren ?? "",
		})),
	);

	return { year, rowCount: rows.length };
}

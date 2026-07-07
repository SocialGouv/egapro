import "server-only";

import { eq, inArray } from "drizzle-orm";
import type { GipMdsRow } from "~/modules/declaration-remuneration/shared/gipMdsMapping";
import { CSV_TO_SCHEMA_MAP } from "~/modules/declaration-remuneration/shared/gipMdsMapping";
import type { DB } from "~/server/db";
import { campaignDeadlines, companies, gipMdsData } from "~/server/db/schema";
import { fetchCompanyBySiren } from "./weez";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * CSV metadata extracted from the first 2 lines of a GIP MDS file.
 * Line 1: destinataire;projet;horodatage;date_debut;date_fin;nb_lignes
 * Line 2: values
 */
type CsvMetadata = {
	/** File-level timestamp emitted by SUIT (`horodatage` column). */
	publicationDate: string;
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
		publicationDate: normaliseSuitDate(metaValues[2] ?? ""),
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
 * SUIT can emit the GIP `horodatage` either as a bare `YYYY-MM-DD` date or as
 * an ISO timestamp `YYYY-MM-DDTHH:mm:ss…`. The admin UI only displays the
 * date part so we trim it here; empty or malformed input is returned as-is
 * and filtered out at the storage layer.
 */
function normaliseSuitDate(value: string): string {
	const trimmed = value.trim();
	return /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? trimmed.slice(0, 10) : trimmed;
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

const WEEZ_CONCURRENCY = 10;

/**
 * Ensure all SIRENs exist in the company table.
 * Fetches company info from Weez for unknown SIRENs, with a fallback name.
 */
async function ensureCompaniesExist(db: DB, sirens: string[]): Promise<void> {
	if (sirens.length === 0) return;

	const existing = await db
		.select({ siren: companies.siren })
		.from(companies)
		.where(inArray(companies.siren, sirens));

	const existingSet = new Set(existing.map((r) => r.siren));
	const missing = sirens.filter((s) => !existingSet.has(s));

	if (missing.length === 0) return;

	// Fetch company info from Weez with limited concurrency
	const companyValues = await fetchCompanyInfoBatch(missing);

	await db.insert(companies).values(companyValues).onConflictDoNothing();
}

type CompanyInsert = {
	siren: string;
	name: string;
	address?: string | null;
	nafCode?: string | null;
	nafLabel?: string | null;
	region?: string | null;
	departmentCode?: string | null;
	departmentLabel?: string | null;
	workforce?: number | null;
	statutDiffusion?: string | null;
};

async function fetchCompanyInfoBatch(
	sirens: string[],
): Promise<Array<CompanyInsert>> {
	const results: Array<CompanyInsert> = [];

	for (let i = 0; i < sirens.length; i += WEEZ_CONCURRENCY) {
		const batch = sirens.slice(i, i + WEEZ_CONCURRENCY);
		const settled = await Promise.allSettled(
			batch.map(async (siren) => {
				try {
					const info = await fetchCompanyBySiren(siren);
					return info
						? {
								siren,
								name: info.name,
								address: info.address,
								nafCode: info.nafCode,
								nafLabel: info.nafLabel,
								region: info.region,
								departmentCode: info.departmentCode,
								departmentLabel: info.departmentLabel,
								workforce: info.workforce,
								statutDiffusion: info.statutDiffusion,
							}
						: { siren, name: `Entreprise ${siren}` };
				} catch {
					return { siren, name: `Entreprise ${siren}` };
				}
			}),
		);

		for (const result of settled) {
			if (result.status === "fulfilled") {
				results.push(result.value);
			}
		}
	}

	return results;
}

/**
 * Reason why the SUIT `horodatage` was not stored on `campaign_deadline`.
 * Surfaced in the import result so callers (audit log, cron response) have a
 * paper trail for partial imports.
 */
export type GipPublicationSkipReason =
	| "invalid_horodatage"
	| "no_campaign_deadline_row";

export type GipImportResult = {
	year: number;
	rowCount: number;
	gipPublicationDate: string | null;
	gipPublicationDateUpdated: boolean;
	gipPublicationDateSkipReason?: GipPublicationSkipReason;
};

/**
 * Import GIP MDS CSV content into the database.
 * Parses the CSV and upserts all rows for the given year.
 * Creates missing companies before inserting GIP data.
 * Returns the row count and whether the `gipPublicationDate` was stored so
 * callers can audit partial imports.
 */
export async function importGipCsvToDb(
	db: DB,
	csvContent: string,
): Promise<GipImportResult> {
	const { metadata, rows } = parseGipCsv(csvContent);
	const year = yearFromPeriodEnd(metadata.periodEnd);

	if (rows.length === 0) {
		return {
			year,
			rowCount: 0,
			gipPublicationDate: null,
			gipPublicationDateUpdated: false,
		};
	}

	// Ensure all referenced companies exist (outside transaction to avoid long locks on Weez calls)
	const uniqueSirens = [
		...new Set(rows.map((r) => r.siren).filter((s): s is string => !!s)),
	];
	await ensureCompaniesExist(db, uniqueSirens);

	const publicationOutcome = await db.transaction(
		async (
			tx,
		): Promise<
			Pick<
				GipImportResult,
				| "gipPublicationDate"
				| "gipPublicationDateUpdated"
				| "gipPublicationDateSkipReason"
			>
		> => {
			// Delete existing data for this year before inserting
			await tx.delete(gipMdsData).where(eq(gipMdsData.year, year));

			// Insert all rows with metadata
			await tx.insert(gipMdsData).values(
				rows.map((row) => ({
					...row,
					year,
					periodStart: metadata.periodStart,
					periodEnd: metadata.periodEnd,
					siren: row.siren ?? "",
				})),
			);

			// Record the SUIT `horodatage` as the GIP publication date — but only
			// on an EXISTING `campaign_deadline` row. We never synthesise a row
			// with placeholder deadlines here: admins must configure the campaign
			// first (decl1/decl2 deadlines are NOT NULL and those values must be
			// decided by a human, not made up by the import).
			if (!ISO_DATE_RE.test(metadata.publicationDate)) {
				console.warn(
					`[gip-mds/import] Ignoring invalid horodatage "${metadata.publicationDate}" for year ${year}`,
				);
				return {
					gipPublicationDate: null,
					gipPublicationDateUpdated: false,
					gipPublicationDateSkipReason: "invalid_horodatage",
				};
			}

			const updated = await tx
				.update(campaignDeadlines)
				.set({ gipPublicationDate: metadata.publicationDate })
				.where(eq(campaignDeadlines.year, year))
				.returning({ year: campaignDeadlines.year });

			if (updated.length === 0) {
				console.warn(
					`[gip-mds/import] No campaign_deadline row for year ${year} — gipPublicationDate not stored. Ask an admin to configure deadlines first.`,
				);
				return {
					gipPublicationDate: metadata.publicationDate,
					gipPublicationDateUpdated: false,
					gipPublicationDateSkipReason: "no_campaign_deadline_row",
				};
			}

			return {
				gipPublicationDate: metadata.publicationDate,
				gipPublicationDateUpdated: true,
			};
		},
	);

	return {
		year,
		rowCount: rows.length,
		...publicationOutcome,
	};
}

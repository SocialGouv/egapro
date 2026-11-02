import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { env } from "~/env.js";
import { getCurrentYear } from "~/modules/domain";

const METADATA_LINE_INDEX = 1;
const PERIOD_START_FIELD = 3;
const PERIOD_END_FIELD = 4;

// The import files rows under the year of `date_fin`, so the period follows the campaign clock instead of the year baked in the file.
function withCampaignPeriod(csv: string, year: number): string {
	const lines = csv.split("\n");
	const fields = lines[METADATA_LINE_INDEX]?.split(";") ?? [];
	fields[PERIOD_START_FIELD] = `${year}-01-01`;
	fields[PERIOD_END_FIELD] = `${year}-12-31`;
	lines[METADATA_LINE_INDEX] = fields.join(";");
	return lines.join("\n");
}

/**
 * Mock GIP MDS API endpoint.
 * Returns the full mock CSV data (300 companies) from data/mock-gip-mds.csv,
 * its reference period aligned on the current campaign year.
 * Used for development and testing until the real API is available.
 *
 * The CSV file is included in the standalone output via outputFileTracingIncludes
 * in next.config.js — no Dockerfile change needed.
 */
export async function GET() {
	if (env.NEXT_PUBLIC_EGAPRO_ENV !== "dev") {
		return new Response(null, { status: 404 });
	}

	const csv = await readFile(
		join(process.cwd(), "data", "mock-gip-mds.csv"),
		"utf-8",
	);

	return new NextResponse(withCampaignPeriod(csv, getCurrentYear()), {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
		},
	});
}

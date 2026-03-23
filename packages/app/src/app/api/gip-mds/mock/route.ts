import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

/**
 * Mock GIP MDS API endpoint.
 * Returns the full mock CSV data (300 companies) from data/mock-gip-mds.csv.
 * Used for development and testing until the real API is available.
 *
 * The CSV file is included in the standalone output via outputFileTracingIncludes
 * in next.config.js — no Dockerfile change needed.
 */
export async function GET() {
	const csv = await readFile(
		join(process.cwd(), "data", "mock-gip-mds.csv"),
		"utf-8",
	);

	return new NextResponse(csv, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
		},
	});
}

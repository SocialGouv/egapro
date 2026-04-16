import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { CountyCode, RegionCode } from "~/modules/domain";
import { COUNTIES, REGIONS } from "~/modules/domain";
import { db } from "~/server/db";
import { referents } from "~/server/db/schema";

async function getAllReferents() {
	return db
		.select({
			region: referents.region,
			county: referents.county,
			name: referents.name,
			type: referents.type,
			value: referents.value,
			principal: referents.principal,
			substituteName: referents.substituteName,
			substituteEmail: referents.substituteEmail,
		})
		.from(referents)
		.orderBy(asc(referents.region), asc(referents.county));
}

function formatCsv(rows: Awaited<ReturnType<typeof getAllReferents>>): string {
	const headers = [
		"Région",
		"Département",
		"Nom",
		"Type",
		"Valeur",
		"Principal",
		"Nom suppléant",
		"Email suppléant",
	];

	const csvRows = [
		headers.join(";"),
		...rows.map((r) =>
			[
				REGIONS[r.region as RegionCode] ?? r.region,
				r.county ? (COUNTIES[r.county as CountyCode] ?? r.county) : "",
				r.name,
				r.type,
				r.value,
				r.principal ? "Oui" : "Non",
				r.substituteName ?? "",
				r.substituteEmail ?? "",
			]
				.map((val) => `"${String(val).replace(/"/g, '""')}"`)
				.join(";"),
		),
	];

	return csvRows.join("\n");
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const format = searchParams.get("format") ?? "json";

	const rows = await getAllReferents();

	if (format === "csv") {
		const csv = formatCsv(rows);
		return new NextResponse(csv, {
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition":
					'attachment; filename="referents_egalite_professionnelle.csv"',
			},
		});
	}

	return NextResponse.json(rows);
}

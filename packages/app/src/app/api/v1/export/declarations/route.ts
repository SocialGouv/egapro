import { and, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import {
	companies,
	cseOpinions,
	declarations,
	jobCategories,
	users,
} from "~/server/db/schema";

const querySchema = z.object({
	date_begin: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "date_begin must be YYYY-MM-DD format"),
	date_end: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "date_end must be YYYY-MM-DD format")
		.optional(),
});

/**
 * GET /api/v1/export/declarations?date_begin=YYYY-MM-DD&date_end=YYYY-MM-DD
 *
 * Public REST API returning submitted declarations as JSON.
 * - date_begin (required): start date (inclusive), filters on submission date (updatedAt)
 * - date_end (optional): end date (exclusive). If omitted, returns only date_begin day.
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const parsed = querySchema.safeParse({
			date_begin: url.searchParams.get("date_begin") ?? undefined,
			date_end: url.searchParams.get("date_end") ?? undefined,
		});

		if (!parsed.success) {
			return Response.json(
				{
					error: "Le paramètre 'date_begin' est requis au format YYYY-MM-DD",
					details: parsed.error.issues,
				},
				{ status: 400 },
			);
		}

		const { date_begin } = parsed.data;
		const dateEnd = parsed.data.date_end ?? getNextDate(date_begin);

		const rows = await db
			.select({
				siren: declarations.siren,
				year: declarations.year,
				status: declarations.status,
				compliancePath: declarations.compliancePath,
				totalWomen: declarations.totalWomen,
				totalMen: declarations.totalMen,
				remunerationScore: declarations.remunerationScore,
				variableRemunerationScore: declarations.variableRemunerationScore,
				quartileScore: declarations.quartileScore,
				categoryScore: declarations.categoryScore,
				secondDeclarationStatus: declarations.secondDeclarationStatus,
				secondDeclReferencePeriodStart:
					declarations.secondDeclReferencePeriodStart,
				secondDeclReferencePeriodEnd: declarations.secondDeclReferencePeriodEnd,
				createdAt: declarations.createdAt,
				updatedAt: declarations.updatedAt,
				declarationId: declarations.id,
				companyName: companies.name,
				workforce: companies.workforce,
				nafCode: companies.nafCode,
				address: companies.address,
				hasCse: companies.hasCse,
				declarantFirstName: users.firstName,
				declarantLastName: users.lastName,
				declarantEmail: users.email,
				declarantPhone: users.phone,
			})
			.from(declarations)
			.innerJoin(companies, eq(declarations.siren, companies.siren))
			.innerJoin(users, eq(declarations.declarantId, users.id))
			.where(
				and(
					eq(declarations.status, "submitted"),
					gte(declarations.updatedAt, new Date(`${date_begin}T00:00:00Z`)),
					lt(declarations.updatedAt, new Date(`${dateEnd}T00:00:00Z`)),
				),
			);

		const declarationIds = rows.map((r) => r.declarationId);
		const hasIndicatorG = await getDeclarationsWithIndicatorG(declarationIds);
		const cseMap = await getCseOpinionsByDeclaration(
			rows.map((r) => ({ siren: r.siren, year: r.year })),
		);

		const data = rows.map((row) => {
			const cseKey = `${row.siren}-${row.year}`;
			const opinions = cseMap.get(cseKey) ?? [];

			return {
				siren: row.siren,
				companyName: row.companyName,
				workforce: row.workforce,
				nafCode: row.nafCode,
				address: row.address,
				hasCse: row.hasCse,
				year: row.year,
				status: row.status,
				declarationType: hasIndicatorG.has(row.declarationId)
					? "7_indicateurs"
					: "6_indicateurs",
				compliancePath: row.compliancePath,
				createdAt: row.createdAt?.toISOString() ?? null,
				updatedAt: row.updatedAt?.toISOString() ?? null,
				totalWomen: row.totalWomen,
				totalMen: row.totalMen,
				scores: {
					remuneration: row.remunerationScore,
					variableRemuneration: row.variableRemunerationScore,
					quartile: row.quartileScore,
					category: row.categoryScore,
				},
				secondDeclaration: {
					status: row.secondDeclarationStatus,
					referencePeriodStart: row.secondDeclReferencePeriodStart,
					referencePeriodEnd: row.secondDeclReferencePeriodEnd,
				},
				declarant: {
					firstName: row.declarantFirstName,
					lastName: row.declarantLastName,
					email: row.declarantEmail,
					phone: row.declarantPhone,
				},
				cseOpinions: opinions.map((o) => ({
					type: o.type,
					opinion: o.opinion,
					date: o.opinionDate,
				})),
			};
		});

		return Response.json({
			dateBegin: date_begin,
			dateEnd: dateEnd,
			count: data.length,
			declarations: data,
		});
	} catch (error) {
		console.error("[api/v1/export/declarations]", error);
		return Response.json(
			{ error: "Erreur lors de la récupération des déclarations" },
			{ status: 500 },
		);
	}
}

function getNextDate(date: string): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10);
}

async function getDeclarationsWithIndicatorG(
	declarationIds: string[],
): Promise<Set<string>> {
	if (declarationIds.length === 0) return new Set();

	const rows = await db
		.selectDistinct({ declarationId: jobCategories.declarationId })
		.from(jobCategories)
		.where(sql`${jobCategories.declarationId} IN ${declarationIds}`);

	return new Set(rows.map((r) => r.declarationId));
}

type CseRow = {
	type: string;
	opinion: string | null;
	opinionDate: string | null;
};

async function getCseOpinionsByDeclaration(
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, CseRow[]>> {
	if (keys.length === 0) return new Map();

	const uniqueSirens = [...new Set(keys.map((k) => k.siren))];
	const uniqueYears = [...new Set(keys.map((k) => k.year))];

	const rows = await db
		.select({
			siren: cseOpinions.siren,
			year: cseOpinions.year,
			type: cseOpinions.type,
			opinion: cseOpinions.opinion,
			opinionDate: cseOpinions.opinionDate,
		})
		.from(cseOpinions)
		.where(
			and(
				sql`${cseOpinions.siren} IN ${uniqueSirens}`,
				sql`${cseOpinions.year} IN ${uniqueYears}`,
			),
		);

	const map = new Map<string, CseRow[]>();
	for (const row of rows) {
		const key = `${row.siren}-${row.year}`;
		const existing = map.get(key) ?? [];
		existing.push({
			type: row.type,
			opinion: row.opinion,
			opinionDate: row.opinionDate,
		});
		map.set(key, existing);
	}
	return map;
}

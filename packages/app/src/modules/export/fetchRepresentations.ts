import "server-only";

import { and, eq, gte, lt } from "drizzle-orm";

import { toNumber } from "~/modules/public-api";
import { db } from "~/server/db";
import { companies, representationDeclarations } from "~/server/db/schema";
import { exportDeclarationsQuerySchema } from "./schemas";

function getNextDate(date: string): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10);
}

export function parseExportDateWindow(
	request: Request,
): { date_begin: string; dateEnd: string } | Response {
	const url = new URL(request.url);
	const parsed = exportDeclarationsQuerySchema.safeParse({
		date_begin: url.searchParams.get("date_begin") ?? undefined,
		date_end: url.searchParams.get("date_end") ?? undefined,
	});

	if (!parsed.success) {
		return Response.json(
			{
				error:
					"Paramètres invalides. 'date_begin' est requis, format YYYY-MM-DD.",
				details: parsed.error.issues,
			},
			{ status: 400 },
		);
	}

	const { date_begin } = parsed.data;
	return {
		date_begin,
		dateEnd: parsed.data.date_end ?? getNextDate(date_begin),
	};
}

async function fetchSubmittedRepresentationsRows(
	dateBegin: string,
	dateEnd: string,
) {
	return db
		.select({
			id: representationDeclarations.id,
			siren: representationDeclarations.siren,
			year: representationDeclarations.year,
			referencePeriodStart: representationDeclarations.referencePeriodStart,
			referencePeriodEnd: representationDeclarations.referencePeriodEnd,
			executiveWomenPercent: representationDeclarations.executiveWomenPercent,
			executiveMenPercent: representationDeclarations.executiveMenPercent,
			notComputableReasonExecutives:
				representationDeclarations.notComputableReasonExecutives,
			memberWomenPercent: representationDeclarations.memberWomenPercent,
			memberMenPercent: representationDeclarations.memberMenPercent,
			notComputableReasonMembers:
				representationDeclarations.notComputableReasonMembers,
			publishDate: representationDeclarations.publishDate,
			publishUrl: representationDeclarations.publishUrl,
			publishModalities: representationDeclarations.publishModalities,
			submittedAt: representationDeclarations.submittedAt,
			companyName: companies.name,
			address: companies.address,
			nafCode: companies.nafCode,
			region: companies.region,
			departmentLabel: companies.departmentLabel,
		})
		.from(representationDeclarations)
		.innerJoin(companies, eq(representationDeclarations.siren, companies.siren))
		.where(
			and(
				eq(representationDeclarations.status, "submitted"),
				gte(
					representationDeclarations.submittedAt,
					new Date(`${dateBegin}T00:00:00Z`),
				),
				lt(
					representationDeclarations.submittedAt,
					new Date(`${dateEnd}T00:00:00Z`),
				),
			),
		);
}

export type RepresentationRow = Awaited<
	ReturnType<typeof fetchSubmittedRepresentationsRows>
>[number];

/**
 * SUIT is a controlling authority — unlike the public representation export
 * (`generateRepresentationExport.ts`), identity and location fields are
 * always returned in full, including for non-diffusible companies (S30).
 */
export function assembleRepresentation(row: RepresentationRow) {
	return {
		id: row.id,
		SIREN: row.siren,
		Raison_sociale: row.companyName,
		Adresse: row.address,
		Code_NAF: row.nafCode,
		Région: row.region,
		Département: row.departmentLabel,
		Année_référence: row.year,
		Période_référence_début: row.referencePeriodStart,
		Période_référence_fin: row.referencePeriodEnd,
		Pourcentage_femmes_cadres: toNumber(row.executiveWomenPercent),
		Pourcentage_hommes_cadres: toNumber(row.executiveMenPercent),
		Motif_non_calculabilité_cadres: row.notComputableReasonExecutives,
		Pourcentage_femmes_membres: toNumber(row.memberWomenPercent),
		Pourcentage_hommes_membres: toNumber(row.memberMenPercent),
		Motif_non_calculabilité_membres: row.notComputableReasonMembers,
		Date_publication: row.publishDate,
		URL_publication: row.publishUrl,
		Modalités_communication: row.publishModalities,
		Date_déclaration: row.submittedAt?.toISOString() ?? null,
	};
}

export async function fetchSubmittedRepresentations(
	dateBegin: string,
	dateEnd: string,
): Promise<RepresentationRow[]> {
	return fetchSubmittedRepresentationsRows(dateBegin, dateEnd);
}

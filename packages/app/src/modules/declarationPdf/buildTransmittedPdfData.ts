import "server-only";

import { and, eq } from "drizzle-orm";
import { getCseYear } from "~/modules/domain";
import { db } from "~/server/db";
import {
	companies,
	cseOpinionFiles,
	cseOpinions,
	declarations,
	jointEvaluationFiles,
} from "~/server/db/schema";

export type TransmittedPdfOpinion = {
	declarationNumber: number;
	type: string;
	opinion: string | null;
	opinionDate: string | null;
	gapConsulted: boolean | null;
};

export type TransmittedPdfFile = {
	fileName: string;
	uploadedAt: Date;
};

export type TransmittedPdfData = {
	companyName: string;
	siren: string;
	year: number;
	generatedAt: string;
	compliancePath: string | null;
	opinions: TransmittedPdfOpinion[];
	cseFiles: TransmittedPdfFile[];
	jointEvaluationFile: TransmittedPdfFile | null;
};

export async function buildTransmittedPdfData(
	siren: string,
	now: Date,
): Promise<TransmittedPdfData> {
	const year = getCseYear();

	const [company] = await db
		.select()
		.from(companies)
		.where(eq(companies.siren, siren))
		.limit(1);

	if (!company) {
		throw new Error("Entreprise introuvable");
	}

	const [declaration] = await db
		.select()
		.from(declarations)
		.where(and(eq(declarations.siren, siren), eq(declarations.year, year)))
		.limit(1);

	const opinions = await db
		.select({
			declarationNumber: cseOpinions.declarationNumber,
			type: cseOpinions.type,
			opinion: cseOpinions.opinion,
			opinionDate: cseOpinions.opinionDate,
			gapConsulted: cseOpinions.gapConsulted,
		})
		.from(cseOpinions)
		.where(and(eq(cseOpinions.siren, siren), eq(cseOpinions.year, year)));

	const cseFiles = await db
		.select({
			fileName: cseOpinionFiles.fileName,
			uploadedAt: cseOpinionFiles.uploadedAt,
		})
		.from(cseOpinionFiles)
		.where(
			and(
				eq(cseOpinionFiles.siren, siren),
				eq(cseOpinionFiles.year, year),
			),
		);

	const [jointFile] = await db
		.select({
			fileName: jointEvaluationFiles.fileName,
			uploadedAt: jointEvaluationFiles.uploadedAt,
		})
		.from(jointEvaluationFiles)
		.where(
			and(
				eq(jointEvaluationFiles.siren, siren),
				eq(jointEvaluationFiles.year, year),
			),
		)
		.limit(1);

	return {
		companyName: company.name,
		siren,
		year,
		generatedAt: now.toLocaleDateString("fr-FR", {
			day: "numeric",
			month: "long",
			year: "numeric",
		}),
		compliancePath: declaration?.compliancePath ?? null,
		opinions,
		cseFiles,
		jointEvaluationFile: jointFile ?? null,
	};
}

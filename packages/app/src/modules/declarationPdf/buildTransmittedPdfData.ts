import "server-only";

import { and, eq } from "drizzle-orm";
import { getCseYear } from "~/modules/domain";
import { db } from "~/server/db";
import {
	companies,
	cseOpinionFiles,
	cseOpinions,
	jointEvaluationFiles,
} from "~/server/db/schema";
import { formatFrenchDate } from "./formatFrenchDate";

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
	opinions: TransmittedPdfOpinion[];
	cseFiles: TransmittedPdfFile[];
	jointEvaluationFile: TransmittedPdfFile | null;
};

export async function buildTransmittedPdfData(
	siren: string,
	now: Date,
): Promise<TransmittedPdfData> {
	const year = getCseYear();

	const [companyResults, opinions, cseFiles, jointFiles] = await Promise.all([
		db.select().from(companies).where(eq(companies.siren, siren)).limit(1),
		db
			.select({
				declarationNumber: cseOpinions.declarationNumber,
				type: cseOpinions.type,
				opinion: cseOpinions.opinion,
				opinionDate: cseOpinions.opinionDate,
				gapConsulted: cseOpinions.gapConsulted,
			})
			.from(cseOpinions)
			.where(and(eq(cseOpinions.siren, siren), eq(cseOpinions.year, year))),
		db
			.select({
				fileName: cseOpinionFiles.fileName,
				uploadedAt: cseOpinionFiles.uploadedAt,
			})
			.from(cseOpinionFiles)
			.where(
				and(eq(cseOpinionFiles.siren, siren), eq(cseOpinionFiles.year, year)),
			),
		db
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
			.limit(1),
	]);

	const company = companyResults[0];
	if (!company) {
		throw new Error("Entreprise introuvable");
	}

	return {
		companyName: company.name,
		siren,
		year,
		generatedAt: formatFrenchDate(now),
		opinions,
		cseFiles,
		jointEvaluationFile: jointFiles[0] ?? null,
	};
}

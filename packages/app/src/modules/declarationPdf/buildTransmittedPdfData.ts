import "server-only";

import { and, eq } from "drizzle-orm";
import { formatLongDate } from "~/modules/domain";
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
	opinions: TransmittedPdfOpinion[];
	cseFiles: TransmittedPdfFile[];
	jointEvaluationFile: TransmittedPdfFile | null;
};

export async function buildTransmittedPdfData(
	siren: string,
	year: number,
	now: Date,
): Promise<TransmittedPdfData> {
	const [companyResults, declarationResults] = await Promise.all([
		db.select().from(companies).where(eq(companies.siren, siren)).limit(1),
		db
			.select({ id: declarations.id, year: declarations.year })
			.from(declarations)
			.where(and(eq(declarations.siren, siren), eq(declarations.year, year)))
			.limit(1),
	]);

	const company = companyResults[0];
	if (!company) {
		throw new Error("Entreprise introuvable");
	}

	const declaration = declarationResults[0];
	if (!declaration) {
		throw new Error("Déclaration introuvable");
	}

	const [opinions, cseFiles, jointFiles] = await Promise.all([
		db
			.select({
				declarationNumber: cseOpinions.declarationNumber,
				type: cseOpinions.type,
				opinion: cseOpinions.opinion,
				opinionDate: cseOpinions.opinionDate,
				gapConsulted: cseOpinions.gapConsulted,
			})
			.from(cseOpinions)
			.where(eq(cseOpinions.declarationId, declaration.id)),
		db
			.select({
				fileName: cseOpinionFiles.fileName,
				uploadedAt: cseOpinionFiles.uploadedAt,
			})
			.from(cseOpinionFiles)
			.where(eq(cseOpinionFiles.declarationId, declaration.id)),
		db
			.select({
				fileName: jointEvaluationFiles.fileName,
				uploadedAt: jointEvaluationFiles.uploadedAt,
			})
			.from(jointEvaluationFiles)
			.where(eq(jointEvaluationFiles.declarationId, declaration.id))
			.limit(1),
	]);

	return {
		companyName: company.name,
		siren,
		year: declaration.year,
		generatedAt: formatLongDate(now),
		opinions,
		cseFiles,
		jointEvaluationFile: jointFiles[0] ?? null,
	};
}

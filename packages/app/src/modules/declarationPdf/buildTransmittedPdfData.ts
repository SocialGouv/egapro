import "server-only";

import { and, eq } from "drizzle-orm";
import { formatLongDate, getWorkforceYearFor } from "~/modules/domain";
import { activeDeclarationFilter } from "~/server/api/routers/declarationHelpers";
import { db } from "~/server/db";
import {
	companies,
	cseOpinions,
	declarations,
	files,
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
	dataYear: number;
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
			.where(activeDeclarationFilter(siren, year))
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
				fileName: files.fileName,
				uploadedAt: files.uploadedAt,
			})
			.from(files)
			.where(
				and(
					eq(files.declarationId, declaration.id),
					eq(files.type, "cse_opinion"),
				),
			),
		db
			.select({
				fileName: files.fileName,
				uploadedAt: files.uploadedAt,
			})
			.from(files)
			.where(
				and(
					eq(files.declarationId, declaration.id),
					eq(files.type, "joint_evaluation"),
				),
			)
			.limit(1),
	]);

	return {
		companyName: company.name,
		siren,
		dataYear: getWorkforceYearFor(declaration.year),
		year: declaration.year,
		generatedAt: formatLongDate(now),
		opinions,
		cseFiles,
		jointEvaluationFile: jointFiles[0] ?? null,
	};
}

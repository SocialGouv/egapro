import "server-only";

import { buildColumnId } from "~/modules/cseOpinion/contentTypeColumns";
import {
	buildSubmittedDeclarations,
	buildSubmittedFileColumns,
	type SubmittedDeclarationBlock,
	type SubmittedFileColumn,
	type SubmittedInfoRow,
} from "~/modules/cseOpinion/submittedOpinionLabels";
import {
	companyLocationRow,
	formatLongDate,
	formatShortDate,
	formatSiren,
	formatWorkforceForUser,
	getDeclarationReferencePeriod,
	getObligationWorkforce,
	getReferenceYearFor,
	isCseRequired,
	parseGipWorkforce,
} from "~/modules/domain";
import { formatFileMeta } from "~/modules/shared/uploadConfig";
import {
	activeDeclarationFilter,
	findTransmittedCseOpinions,
	type TransmittedCseOpinions,
} from "~/server/api/routers/declarationHelpers";
import { db } from "~/server/db";
import { declarations } from "~/server/db/schema";
import { getFileSize } from "~/server/services/s3";

import { formatCsePresence } from "./formatCsePresence";
import { formatNaf } from "./formatNaf";

const CSE_OPINION_FILE_FORMAT = "PDF";
const NOT_PROVIDED = "Non renseigné";

export class CseOpinionNotTransmittedError extends Error {
	constructor() {
		super("Avis du CSE non transmis");
		this.name = "CseOpinionNotTransmittedError";
	}
}

export type CseOpinionRecapFile = {
	id: string;
	name: string;
	detail: string;
	columnIds: string[];
};

export type CseOpinionRecapData = {
	year: number;
	transmittedAt: string;
	company: { name: string; siren: string };
	declarantRows: SubmittedInfoRow[];
	companyRows: SubmittedInfoRow[];
	referencePeriods: SubmittedInfoRow[];
	declarations: SubmittedDeclarationBlock[];
	fileColumns: SubmittedFileColumn[];
	files: CseOpinionRecapFile[];
};

export function cseOpinionPdfFilename(siren: string, year: number): string {
	return `avis-cse-${siren}-${year}.pdf`;
}

function buildReferencePeriods({
	year,
	hasSubmittedSecondDeclaration,
	secondDeclReferencePeriodStart,
	secondDeclReferencePeriodEnd,
}: TransmittedCseOpinions): SubmittedInfoRow[] {
	const firstPeriod = getDeclarationReferencePeriod(year, false, null, null);
	if (!hasSubmittedSecondDeclaration) {
		return [{ label: "Période de référence", value: firstPeriod }];
	}
	return [
		{
			label: "Période de référence de la première déclaration",
			value: firstPeriod,
		},
		{
			label: "Période de référence de la seconde déclaration",
			value: getDeclarationReferencePeriod(
				year,
				true,
				secondDeclReferencePeriodStart,
				secondDeclReferencePeriodEnd,
			),
		},
	];
}

async function buildFiles(
	associations: TransmittedCseOpinions["associations"],
): Promise<CseOpinionRecapFile[]> {
	const byFile = new Map<
		string,
		{
			fileName: string;
			filePath: string;
			uploadedAt: Date;
			columnIds: string[];
		}
	>();
	for (const association of associations) {
		const columnId = buildColumnId(
			association.declarationNumber,
			association.type,
		);
		const existing = byFile.get(association.fileId);
		if (existing) {
			existing.columnIds.push(columnId);
		} else {
			byFile.set(association.fileId, {
				fileName: association.fileName,
				filePath: association.filePath,
				uploadedAt: association.uploadedAt,
				columnIds: [columnId],
			});
		}
	}
	const sorted = [...byFile.entries()].sort(
		([, a], [, b]) =>
			a.uploadedAt.getTime() - b.uploadedAt.getTime() ||
			a.fileName.localeCompare(b.fileName),
	);
	return Promise.all(
		sorted.map(async ([id, file]) => {
			const size = await getFileSize(file.filePath);
			return {
				id,
				name: file.fileName,
				detail: `${formatFileMeta(CSE_OPINION_FILE_FORMAT, size)} · déposé le ${formatLongDate(file.uploadedAt)}`,
				columnIds: file.columnIds,
			};
		}),
	);
}

function buildCompanyRows({
	company,
	year,
	workforceEma,
}: TransmittedCseOpinions): SubmittedInfoRow[] {
	const workforce = parseGipWorkforce(workforceEma);
	const location = companyLocationRow({
		countryCode: company.countryCode,
		countryLabel: company.countryLabel,
		departmentLabel: company.departmentLabel,
		domesticAddress: company.address,
	});
	return [
		{ label: "Raison sociale", value: company.name },
		{ label: "SIREN", value: formatSiren(company.siren) },
		...(location ? [location] : []),
		{ label: "Code NAF", value: formatNaf(company.nafCode, company.nafLabel) },
		{
			label: `Effectif annuel moyen en ${getReferenceYearFor(year)}`,
			value: formatWorkforceForUser(workforce),
		},
		...(isCseRequired(getObligationWorkforce(workforce))
			? [
					{
						label: "Existence d'un CSE",
						value: formatCsePresence(company.hasCse),
					},
				]
			: []),
	];
}

export async function assembleCseOpinionRecap(
	transmitted: TransmittedCseOpinions,
): Promise<CseOpinionRecapData> {
	const { company, declarant, year } = transmitted;

	return {
		year,
		transmittedAt: formatShortDate(transmitted.submittedAt),
		company: { name: company.name, siren: formatSiren(company.siren) },
		declarantRows: [
			{
				label: "Nom Prénom",
				value:
					[declarant.firstName, declarant.lastName].filter(Boolean).join(" ") ||
					NOT_PROVIDED,
			},
			{ label: "Adresse email", value: declarant.email },
			{ label: "Numéro de téléphone", value: declarant.phone || NOT_PROVIDED },
		],
		companyRows: buildCompanyRows(transmitted),
		referencePeriods: buildReferencePeriods(transmitted),
		declarations: buildSubmittedDeclarations(
			transmitted.opinions,
			transmitted.hasSubmittedSecondDeclaration,
		),
		fileColumns: buildSubmittedFileColumns(
			transmitted.associations,
			transmitted.hasSubmittedSecondDeclaration,
		),
		files: await buildFiles(transmitted.associations),
	};
}

export async function buildCseOpinionRecapData(
	siren: string,
	year: number,
): Promise<CseOpinionRecapData> {
	const [declaration] = await db
		.select({ id: declarations.id })
		.from(declarations)
		.where(activeDeclarationFilter(siren, year))
		.limit(1);
	if (!declaration) throw new CseOpinionNotTransmittedError();

	const transmitted = await findTransmittedCseOpinions(db, declaration.id);
	if (!transmitted) throw new CseOpinionNotTransmittedError();

	return assembleCseOpinionRecap(transmitted);
}

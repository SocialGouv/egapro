import { formatIsoDate } from "~/modules/domain";

import {
	buildColumnId,
	getContentTypeDescription,
	getContentTypeHeader,
} from "./contentTypeColumns";
import {
	type ContentType,
	CSE_OPINION_CONTENT_TYPES,
	type DeclarationNumber,
} from "./types";

export type SubmittedInfoRow = { label: string; value: string };

export type SubmittedOpinionInput = {
	declarationNumber: number;
	type: string;
	gapConsulted: boolean | null;
	opinion: string | null;
	opinionDate: string | null;
};

export type SubmittedOpinionBlock = {
	id: string;
	title: string;
	rows: SubmittedInfoRow[];
};

export type SubmittedDeclarationBlock = {
	declarationNumber: DeclarationNumber;
	title: string;
	opinions: SubmittedOpinionBlock[];
};

export type SubmittedFileColumn = {
	id: string;
	label: string;
	declarationLabel: string | null;
};

const NOT_PROVIDED = "Non renseigné";

export const SUBMITTED_DECLARATION_TITLES: Record<DeclarationNumber, string> = {
	1: "Première déclaration",
	2: "Seconde déclaration",
};

export const SUBMITTED_OPINION_LABELS = {
	gapConsulted: "CSE informé et consulté",
	opinion: "Avis du CSE",
	opinionDate: "Date de l'avis rendu par le CSE",
} as const;

export const SUBMITTED_FILES_TITLE = "Fichier(s) déposé(s)";
export const ASSOCIATED_FILE_LABEL = "Avis associé";
export const UNASSOCIATED_FILE_LABEL = "Non associé";

const OPINION_VALUES: Record<string, string> = {
	favorable: "Favorable",
	unfavorable: "Défavorable",
};

function isDeclarationNumber(value: number): value is DeclarationNumber {
	return value === 1 || value === 2;
}

function isContentType(value: string): value is ContentType {
	return (CSE_OPINION_CONTENT_TYPES as readonly string[]).includes(value);
}

function contentTypeRank(type: ContentType): number {
	return CSE_OPINION_CONTENT_TYPES.indexOf(type);
}

function compareContentTypes(
	a: { declarationNumber: DeclarationNumber; type: ContentType },
	b: { declarationNumber: DeclarationNumber; type: ContentType },
): number {
	return (
		a.declarationNumber - b.declarationNumber ||
		contentTypeRank(a.type) - contentTypeRank(b.type)
	);
}

export function formatSubmittedOpinion(opinion: string | null): string {
	return (opinion && OPINION_VALUES[opinion]) || NOT_PROVIDED;
}

export function formatGapConsulted(gapConsulted: boolean | null): string {
	if (gapConsulted === null) return NOT_PROVIDED;
	return gapConsulted ? "Oui" : "Non";
}

export function buildSubmittedOpinionRows(
	opinion: Pick<
		SubmittedOpinionInput,
		"type" | "gapConsulted" | "opinion" | "opinionDate"
	>,
): SubmittedInfoRow[] {
	const rows: SubmittedInfoRow[] = [];
	if (opinion.type === "gap") {
		rows.push({
			label: SUBMITTED_OPINION_LABELS.gapConsulted,
			value: formatGapConsulted(opinion.gapConsulted),
		});
		if (opinion.gapConsulted === false) return rows;
	}
	rows.push(
		{
			label: SUBMITTED_OPINION_LABELS.opinion,
			value: formatSubmittedOpinion(opinion.opinion),
		},
		{
			label: SUBMITTED_OPINION_LABELS.opinionDate,
			value: opinion.opinionDate
				? formatIsoDate(opinion.opinionDate)
				: NOT_PROVIDED,
		},
	);
	return rows;
}

export function buildSubmittedDeclarations(
	opinions: SubmittedOpinionInput[],
	hasSubmittedSecondDeclaration: boolean,
): SubmittedDeclarationBlock[] {
	const declarationNumbers: DeclarationNumber[] = hasSubmittedSecondDeclaration
		? [1, 2]
		: [1];
	return declarationNumbers.map((declarationNumber) => ({
		declarationNumber,
		title: SUBMITTED_DECLARATION_TITLES[declarationNumber],
		opinions: opinions
			.flatMap((opinion) =>
				opinion.declarationNumber === declarationNumber &&
				isContentType(opinion.type)
					? [{ ...opinion, declarationNumber, type: opinion.type }]
					: [],
			)
			.sort(compareContentTypes)
			.map((opinion) => ({
				id: buildColumnId(opinion.declarationNumber, opinion.type),
				title: getContentTypeDescription(
					opinion.declarationNumber,
					opinion.type,
				),
				rows: buildSubmittedOpinionRows(opinion),
			})),
	}));
}

export function buildSubmittedFileColumns(
	associations: { declarationNumber: number; type: string }[],
	hasSubmittedSecondDeclaration: boolean,
): SubmittedFileColumn[] {
	const keys = new Map<
		string,
		{ declarationNumber: DeclarationNumber; type: ContentType }
	>();
	for (const { declarationNumber, type } of associations) {
		if (isDeclarationNumber(declarationNumber) && isContentType(type)) {
			keys.set(buildColumnId(declarationNumber, type), {
				declarationNumber,
				type,
			});
		}
	}
	return [...keys.entries()]
		.sort(([, a], [, b]) => compareContentTypes(a, b))
		.map(([id, { declarationNumber, type }]) => ({
			id,
			...getContentTypeHeader(
				declarationNumber,
				type,
				hasSubmittedSecondDeclaration,
			),
		}));
}

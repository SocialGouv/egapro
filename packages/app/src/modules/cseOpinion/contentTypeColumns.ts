import {
	type GapJustification,
	isCseJustificationOpinionRequired,
} from "~/modules/domain";
import type {
	AssociationMap,
	ContentType,
	ContentTypeColumn,
	ContentTypeColumnsInput,
	ContentTypeKey,
	DeclarationNumber,
	FileContentTypeAssociation,
	StoredFileContentType,
} from "./types";

const ACCURACY_OPINION_TITLES: Record<DeclarationNumber, string> = {
	1: "Exactitude des données utilisées pour le calcul, la méthode de calcul et les résultats de chaque indicateur.",
	2: "Exactitude des données utilisées pour le calcul, la méthode de calcul et les résultats de la seconde déclaration de l'indicateur par catégorie d'emplois.",
};

const JUSTIFICATION_OPINION_TITLE =
	"Justification des écarts ≥ 5 % par des critères objectifs et non fondés sur le sexe de l'indicateur par catégorie d'emplois.";

export function getOpinionTitle(
	declarationNumber: DeclarationNumber,
	type: ContentType,
): string {
	return type === "accuracy"
		? ACCURACY_OPINION_TITLES[declarationNumber]
		: JUSTIFICATION_OPINION_TITLE;
}

export const DECLARATION_HEADINGS: Record<DeclarationNumber, string> = {
	1: "Première déclaration",
	2: "Seconde déclaration",
};

export const TYPE_LABELS: Record<ContentType, string> = {
	accuracy: "Exactitude",
	gap: "Justification",
};

const DECLARATION_LABELS: Record<DeclarationNumber, string> = {
	1: "1re déclaration",
	2: "2e déclaration",
};

const DECLARATION_ORDINALS: Record<DeclarationNumber, string> = {
	1: "première",
	2: "seconde",
};

const TYPE_ERROR_PHRASES: Record<ContentType, string> = {
	accuracy: "d'exactitude des données et des méthodes de calcul",
	gap: "justifiant les écarts ≥ 5 %",
};

export const MISSING_OPINION_ALERT_TITLE = "Un avis CSE est manquant";

export const NO_FILE_ALERT = {
	title: "Aucun avis déposé",
	message:
		"Vous devez déposer le ou les avis de votre CSE au format PDF avant de transmettre.",
} as const;

export const UNASSOCIATED_FILE_ALERT = {
	title: "Type d'avis non renseigné",
	message:
		"Pour chaque fichier déposé, cochez le ou les types d'avis qu'il contient avant de transmettre.",
} as const;

export function getMissingOpinionMessage(
	{ declarationNumber, type }: ContentTypeKey,
	hasSecondDeclaration: boolean,
): string {
	const declarationPart = hasSecondDeclaration
		? ` de la ${DECLARATION_ORDINALS[declarationNumber]} déclaration`
		: "";
	return `Ajoutez l'avis ${TYPE_ERROR_PHRASES[type]}${declarationPart}, ou indiquez s'il est déjà inclus dans l'un des fichiers déposés.`;
}

export function computeJustificationRequirements({
	firstDeclarationGapJustification,
	secondDeclarationGapJustification,
	firstDeclGapHigh,
	secondDeclGapHigh,
}: {
	firstDeclarationGapJustification: GapJustification | null;
	secondDeclarationGapJustification: GapJustification | null;
	firstDeclGapHigh: boolean;
	secondDeclGapHigh: boolean;
}): Pick<
	ContentTypeColumnsInput,
	"firstDeclJustificationRequired" | "secondDeclJustificationRequired"
> {
	return {
		firstDeclJustificationRequired: isCseJustificationOpinionRequired({
			gapHigh: firstDeclGapHigh,
			gapJustification: firstDeclarationGapJustification,
		}),
		secondDeclJustificationRequired: isCseJustificationOpinionRequired({
			gapHigh: secondDeclGapHigh,
			gapJustification: secondDeclarationGapJustification,
		}),
	};
}

export function buildColumnId(declarationNumber: number, type: string): string {
	return `${declarationNumber}:${type}`;
}

function buildColumn(
	declarationNumber: DeclarationNumber,
	type: ContentType,
	hasSecondDeclaration: boolean,
): ContentTypeColumn {
	return {
		id: buildColumnId(declarationNumber, type),
		declarationNumber,
		type,
		label: TYPE_LABELS[type],
		declarationLabel: hasSecondDeclaration
			? DECLARATION_LABELS[declarationNumber]
			: null,
		description: getOpinionTitle(declarationNumber, type),
		missingMessage: getMissingOpinionMessage(
			{ declarationNumber, type },
			hasSecondDeclaration,
		),
	};
}

export function computeRequiredContentTypes({
	hasSecondDeclaration,
	firstDeclJustificationRequired,
	secondDeclJustificationRequired,
}: ContentTypeColumnsInput): ContentTypeKey[] {
	const specs: ContentTypeKey[] = [{ declarationNumber: 1, type: "accuracy" }];

	if (firstDeclJustificationRequired) {
		specs.push({ declarationNumber: 1, type: "gap" });
	}

	if (hasSecondDeclaration) {
		specs.push({ declarationNumber: 2, type: "accuracy" });
		if (secondDeclJustificationRequired) {
			specs.push({ declarationNumber: 2, type: "gap" });
		}
	}

	return specs;
}

export function computeContentTypeColumns(
	input: ContentTypeColumnsInput,
): ContentTypeColumn[] {
	return computeRequiredContentTypes(input).map((spec) =>
		buildColumn(spec.declarationNumber, spec.type, input.hasSecondDeclaration),
	);
}

export function buildAssociationMap(
	columns: ContentTypeColumn[],
	associations: StoredFileContentType[],
): AssociationMap {
	const map: AssociationMap = {};
	for (const column of columns) {
		map[column.id] = null;
	}
	for (const association of associations) {
		const id = buildColumnId(association.declarationNumber, association.type);
		if (id in map) {
			map[id] = association.fileId;
		}
	}
	return map;
}

export function toAssociationPayload(
	columns: ContentTypeColumn[],
	map: AssociationMap,
): FileContentTypeAssociation[] {
	const payload: FileContentTypeAssociation[] = [];
	for (const column of columns) {
		const fileId = map[column.id];
		if (fileId) {
			payload.push({
				declarationNumber: column.declarationNumber,
				type: column.type,
				fileId,
			});
		}
	}
	return payload;
}

export function getMissingColumns(
	columns: ContentTypeColumn[],
	map: AssociationMap,
): ContentTypeColumn[] {
	return columns.filter((column) => !map[column.id]);
}

// Files that are not associated to any content type (no checkbox checked on
// their row). Finalize must reject these orphans before submission.
export function getUnassociatedFiles<T extends { id: string }>(
	files: T[],
	map: AssociationMap,
): T[] {
	const associatedFileIds = new Set(
		Object.values(map).filter((fileId): fileId is string => fileId !== null),
	);
	return files.filter((file) => !associatedFileIds.has(file.id));
}

// One required column caps the upload at one file, so the pairing is not a choice.
export function getSingleChoiceAssociation(
	columns: ContentTypeColumn[],
	files: { id: string }[],
): { columnId: string; fileId: string } | null {
	const [column] = columns;
	const [file] = files;
	if (columns.length !== 1 || files.length !== 1 || !column || !file) {
		return null;
	}
	return { columnId: column.id, fileId: file.id };
}

export function clearFileAssociations(
	map: AssociationMap,
	fileId: string,
): AssociationMap {
	const next: AssociationMap = {};
	for (const key of Object.keys(map)) {
		next[key] = map[key] === fileId ? null : (map[key] ?? null);
	}
	return next;
}

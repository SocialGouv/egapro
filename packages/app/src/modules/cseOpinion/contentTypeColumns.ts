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

const ACCURACY_DESCRIPTIONS: Record<DeclarationNumber, string> = {
	1: "Exactitude des données et des méthodes de calcul de la déclaration de l'ensemble des indicateurs",
	2: "Exactitude des données et des méthodes de calcul de la seconde déclaration de l'indicateur de rémunération par catégorie de salariés",
};

const GAP_DESCRIPTION =
	"Justification des écarts ≥ 5 % par des critères objectifs et non sexistes de l'indicateur de rémunération par catégorie de salariés";

const TYPE_LABELS: Record<ContentType, string> = {
	accuracy: "Exactitude",
	gap: "Justification",
};

const DECLARATION_LABELS: Record<DeclarationNumber, string> = {
	1: "1re déclaration",
	2: "2e déclaration",
};

const DECLARATION_ORDINALS: Record<DeclarationNumber, string> = {
	1: "première",
	2: "deuxième",
};

const TYPE_ERROR_PHRASES: Record<ContentType, string> = {
	accuracy: "d'exactitude des données et des méthodes de calcul",
	gap: "justifiant les écarts ≥ 5 %",
};

export function buildColumnId(declarationNumber: number, type: string): string {
	return `${declarationNumber}:${type}`;
}

function buildColumn(
	declarationNumber: DeclarationNumber,
	type: ContentType,
	hasSecondDeclaration: boolean,
): ContentTypeColumn {
	const description =
		type === "accuracy"
			? ACCURACY_DESCRIPTIONS[declarationNumber]
			: GAP_DESCRIPTION;
	const declarationPart = hasSecondDeclaration
		? ` de la ${DECLARATION_ORDINALS[declarationNumber]} déclaration`
		: "";

	return {
		id: buildColumnId(declarationNumber, type),
		declarationNumber,
		type,
		label: TYPE_LABELS[type],
		declarationLabel: hasSecondDeclaration
			? DECLARATION_LABELS[declarationNumber]
			: null,
		description,
		missingMessage: `Ajoutez l'avis ${TYPE_ERROR_PHRASES[type]}${declarationPart}, ou indiquez s'il est déjà inclus dans l'un des fichiers déposés.`,
	};
}

// Single source of truth for the content types the parcours requires. Justification
// (gap) is required only when the declaration has a gap >= 5% AND the CSE was
// consulted on justifying it (besoin epic-3476). Shared by the Step 2 matrix (UI)
// and the finalize guard (server) so the displayed columns and the validated types
// can never diverge.
export function computeRequiredContentTypes({
	hasSecondDeclaration,
	firstDeclGapConsulted,
	secondDeclGapConsulted,
	firstDeclGapHigh,
	secondDeclGapHigh,
}: ContentTypeColumnsInput): ContentTypeKey[] {
	const specs: ContentTypeKey[] = [{ declarationNumber: 1, type: "accuracy" }];

	if (firstDeclGapHigh && firstDeclGapConsulted === true) {
		specs.push({ declarationNumber: 1, type: "gap" });
	}

	if (hasSecondDeclaration) {
		specs.push({ declarationNumber: 2, type: "accuracy" });
		if (secondDeclGapHigh && secondDeclGapConsulted === true) {
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

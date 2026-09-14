// Submodule imports, not the barrels: `~/modules/cseOpinion` and
// `~/modules/declaration-remuneration` both re-export React components, which a
// pure derivation module has no business dragging in.
import { opinionTypeSchema } from "~/modules/cseOpinion/schemas";
import { CSE_OPINION_CONTENT_TYPES } from "~/modules/cseOpinion/types";
import {
	CATEGORY_SOURCES,
	LEGACY_SOURCE_LABELS,
} from "~/modules/declaration-remuneration/steps/step5/sources";
import { DECLARATION_FSM_STATUSES } from "~/modules/domain";
import { compliancePathEnum, fileTypeEnum } from "~/server/db/schema";
import {
	listCompliancePathsByRound,
	type PathChoiceRound,
} from "~/server/rules/compliancePaths";
import { loadRules } from "~/server/rules/engine";
import { CURRENT_RULES_VERSION } from "~/server/rules/version";
import { resolveTargetStageLabel } from "./nextStepsPayload";
import {
	DECLARATION_EVENT_TYPE_LABELS,
	type DeclarationEventType,
	getStatusHistoryLabel,
	PATH_CHOICE_VALUE_LABELS,
} from "./statusHistoryLabels";
import {
	ACTIVE_CATEGORY_SOURCE_MEANINGS,
	COMPLIANCE_PATH_MEANINGS,
	CSE_OPINION_CONTENT_TYPE_LABELS,
	CSE_OPINION_CONTENT_TYPE_MEANINGS,
	EVENT_TYPE_MEANINGS,
	FILE_TYPE_LABELS,
	FILE_TYPE_MEANINGS,
	type FileType,
	FSM_STATUS_MEANINGS,
	HOMONYMS,
	LEGACY_CATEGORY_SOURCE_MEANING,
	OPINION_TYPE_LABELS,
	OPINION_TYPE_MEANINGS,
	type SuitHomonym,
} from "./suitValueGlossary";

export type { SuitHomonym };

export type SuitValueRow = {
	value: string;
	label: string | null;
	extra: string | null;
	meaning: string;
};

export type SuitFieldTable = {
	field: string;
	endpoint: string;
	description: string;
	presence: string;
	sources: string[];
	extraColumn: string | null;
	rows: SuitValueRow[];
};

export type SuitValueTablesPage = {
	rulesVersion: string;
	regenerateCommand: string;
	sources: string[];
	homonyms: SuitHomonym[];
	tables: SuitFieldTable[];
};

export const SUIT_VALUES_REGENERATE_COMMAND =
	"pnpm --filter app docs:suit-values";

const DECLARATIONS_ENDPOINT = "GET /api/v1/export/declarations";
const FILES_ENDPOINT = "GET /api/v1/files";

const EVENT_TYPES = Object.keys(
	DECLARATION_EVENT_TYPE_LABELS,
) as DeclarationEventType[];

function plainRow(value: string, meaning: string): SuitValueRow {
	return { value, label: null, extra: null, meaning };
}

function buildFsmStatusTable(): SuitFieldTable {
	const rules = loadRules(CURRENT_RULES_VERSION);
	return {
		field: "Parcours.Statut",
		endpoint: DECLARATIONS_ENDPOINT,
		description:
			"État courant de la déclaration dans la machine à états versionnée.",
		presence: "Toujours présent.",
		sources: [
			"`DECLARATION_FSM_STATUSES` (`modules/domain/types.ts`)",
			`libellés : étapes du ruleset \`v${CURRENT_RULES_VERSION}\``,
		],
		extraColumn: null,
		rows: DECLARATION_FSM_STATUSES.map((status) => ({
			value: status,
			label: resolveTargetStageLabel(rules, status),
			extra: null,
			meaning: FSM_STATUS_MEANINGS[status],
		})),
	};
}

function buildEventTypeTable(): SuitFieldTable {
	return {
		field: "Historique_statuts[].Statut",
		endpoint: DECLARATIONS_ENDPOINT,
		description:
			"Type d'événement brut de la ligne d'historique. Ce n'est pas un état de la machine à états.",
		presence:
			"Toujours présent sur chaque ligne. `Historique_statuts` vaut `[]` si aucun événement n'est enregistré — jamais `null`, jamais absent.",
		sources: [
			"`DECLARATION_EVENT_TYPE_LABELS` (`modules/export/shared/statusHistoryLabels.ts`)",
		],
		extraColumn: null,
		rows: EVENT_TYPES.map((eventType) => ({
			value: eventType,
			label: DECLARATION_EVENT_TYPE_LABELS[eventType],
			extra: null,
			meaning: EVENT_TYPE_MEANINGS[eventType],
		})),
	};
}

function buildStatusHistoryLabelTable(): SuitFieldTable {
	const genericRows = EVENT_TYPES.map((eventType) =>
		plainRow(
			getStatusHistoryLabel(eventType, null),
			eventType === "path_choice"
				? "Événement `path_choice` dont le parcours est inconnu ou absent."
				: `Événement \`${eventType}\`.`,
		),
	);

	const pathRows = compliancePathEnum.enumValues.map((path) =>
		plainRow(
			getStatusHistoryLabel("path_choice", path),
			`Événement \`path_choice\` portant la valeur \`${path}\`.`,
		),
	);

	return {
		field: "Historique_statuts[].Libelle_statut",
		endpoint: DECLARATIONS_ENDPOINT,
		description:
			"Libellé FR lisible de la ligne d'historique. La liste ci-dessous est exhaustive.",
		presence: "Toujours présent sur chaque ligne.",
		sources: [
			"`getStatusHistoryLabel` (`modules/export/shared/statusHistoryLabels.ts`)",
		],
		extraColumn: null,
		rows: [...genericRows, ...pathRows],
	};
}

function buildPathChoiceTable(round: PathChoiceRound): SuitFieldTable {
	const ordinal = round === 1 ? "première" : "seconde";
	return {
		field: `Parcours_apres_declaration_${round}`,
		endpoint: DECLARATIONS_ENDPOINT,
		description: `Parcours de mise en conformité choisi après la ${ordinal} déclaration.`,
		presence: "`null` tant qu'aucun choix n'a été fait à ce tour.",
		sources: [
			"`compliance_path` (`server/db/schema.ts`)",
			"disponibilité par tour : événements `path_choice` des rulesets embarqués",
		],
		extraColumn: null,
		rows: listCompliancePathsByRound()[round].map((path) => ({
			value: path,
			label: PATH_CHOICE_VALUE_LABELS[path],
			extra: null,
			meaning: COMPLIANCE_PATH_MEANINGS[path],
		})),
	};
}

function buildHistoryDeclarationNumberTable(): SuitFieldTable {
	return {
		field: "Historique_statuts[].Numero_declaration",
		endpoint: DECLARATIONS_ENDPOINT,
		description: "Tour du choix de parcours porté par la ligne d'historique.",
		presence:
			"Présent uniquement sur les lignes dont `Statut` vaut `path_choice`. Absent — et non `null` — sur toutes les autres.",
		sources: ["événements `path_choice` des rulesets embarqués"],
		extraColumn: null,
		rows: [
			plainRow(
				"1",
				"Choix de parcours effectué après la déclaration initiale.",
			),
			plainRow("2", "Choix de parcours effectué après la seconde déclaration."),
		],
	};
}

function buildOpinionDeclarationNumberTable(): SuitFieldTable {
	return {
		field: "Avis_CSE[].Numero_declaration",
		endpoint: DECLARATIONS_ENDPOINT,
		description: "Déclaration sur laquelle porte l'avis du CSE.",
		presence: "Toujours présent sur chaque avis.",
		sources: ["`DeclarationNumber` (`modules/cseOpinion/types.ts`)"],
		extraColumn: null,
		rows: [
			plainRow("1", "L'avis porte sur la déclaration initiale."),
			plainRow("2", "L'avis porte sur la seconde déclaration."),
		],
	};
}

function buildCseOpinionTypeTable(): SuitFieldTable {
	return {
		field: "Avis_CSE[].Type",
		endpoint: DECLARATIONS_ENDPOINT,
		description: "Objet de la consultation du CSE.",
		presence:
			"Toujours présent sur chaque avis. Le bloc `Avis_CSE` est absent si aucun fichier d'avis CSE n'a été déposé.",
		sources: ["`CSE_OPINION_CONTENT_TYPES` (`modules/cseOpinion/types.ts`)"],
		extraColumn: null,
		rows: CSE_OPINION_CONTENT_TYPES.map((type) => ({
			value: type,
			label: CSE_OPINION_CONTENT_TYPE_LABELS[type],
			extra: null,
			meaning: CSE_OPINION_CONTENT_TYPE_MEANINGS[type],
		})),
	};
}

function buildCseOpinionValueTable(): SuitFieldTable {
	return {
		field: "Avis_CSE[].Avis",
		endpoint: DECLARATIONS_ENDPOINT,
		description: "Sens de l'avis rendu par le CSE.",
		presence:
			"`null` lorsque l'avis n'a pas été renseigné — le cas notamment lorsque le CSE n'a pas été consulté sur les mesures de correction.",
		sources: ["`opinionTypeSchema` (`modules/cseOpinion/schemas.ts`)"],
		extraColumn: null,
		rows: opinionTypeSchema.options.map((opinion) => ({
			value: opinion,
			label: OPINION_TYPE_LABELS[opinion],
			extra: null,
			meaning: OPINION_TYPE_MEANINGS[opinion],
		})),
	};
}

function buildFileTypeTable(input: {
	field: string;
	endpoint: string;
	description: string;
	presence: string;
	types: readonly FileType[];
}): SuitFieldTable {
	return {
		field: input.field,
		endpoint: input.endpoint,
		description: input.description,
		presence: input.presence,
		sources: ["`file_type` (`server/db/schema.ts`)"],
		extraColumn: null,
		rows: input.types.map((type) => ({
			value: type,
			label: FILE_TYPE_LABELS[type],
			extra: null,
			meaning: FILE_TYPE_MEANINGS[type],
		})),
	};
}

function buildCategorySourceTable(): SuitFieldTable {
	const activeRows: SuitValueRow[] = CATEGORY_SOURCES.map((source) => ({
		value: source.value,
		label: source.label,
		extra: "Active",
		meaning: ACTIVE_CATEGORY_SOURCE_MEANINGS[source.value],
	}));

	const legacyRows: SuitValueRow[] = Object.entries(LEGACY_SOURCE_LABELS).map(
		([value, label]) => ({
			value,
			label,
			extra: "Historique",
			meaning: LEGACY_CATEGORY_SOURCE_MEANING,
		}),
	);

	return {
		field: "Source_categories_emplois",
		endpoint: DECLARATIONS_ENDPOINT,
		description:
			"Source de détermination des catégories d'emplois de l'indicateur G. Servie brute depuis une colonne texte libre, sans conversion.",
		presence: "`null` si aucun indicateur G n'a été déclaré.",
		sources: [
			"`CATEGORY_SOURCES` et `LEGACY_SOURCE_LABELS` (`modules/declaration-remuneration/steps/step5/sources.ts`)",
		],
		extraColumn: "Disponibilité",
		rows: [...activeRows, ...legacyRows],
	};
}

function buildSecondDeclarationStatusTable(): SuitFieldTable {
	return {
		field: "Seconde_declaration.Statut",
		endpoint: DECLARATIONS_ENDPOINT,
		description:
			"Booléen, et non un état : indique si la seconde déclaration a été soumise.",
		presence: "Toujours présent.",
		sources: ["`assembleDeclaration` (`modules/export/fetchDeclarations.ts`)"],
		extraColumn: null,
		rows: [
			plainRow("true", "Une seconde déclaration a été soumise."),
			plainRow("false", "Aucune seconde déclaration n'a été soumise."),
		],
	};
}

export function buildSuitValueTablesPage(): SuitValueTablesPage {
	return {
		rulesVersion: CURRENT_RULES_VERSION,
		regenerateCommand: SUIT_VALUES_REGENERATE_COMMAND,
		sources: [
			"`packages/app/src/modules/domain/types.ts`",
			"`packages/app/src/modules/export/shared/statusHistoryLabels.ts`",
			"`packages/app/src/modules/cseOpinion/types.ts`, `schemas.ts`",
			"`packages/app/src/modules/declaration-remuneration/steps/step5/sources.ts`",
			"`packages/app/src/server/db/schema.ts`",
			`\`packages/app/src/server/rules/v${CURRENT_RULES_VERSION}.json\``,
		],
		homonyms: HOMONYMS,
		tables: [
			buildFsmStatusTable(),
			buildEventTypeTable(),
			buildStatusHistoryLabelTable(),
			buildHistoryDeclarationNumberTable(),
			buildPathChoiceTable(1),
			buildPathChoiceTable(2),
			buildCseOpinionTypeTable(),
			buildCseOpinionValueTable(),
			buildOpinionDeclarationNumberTable(),
			buildFileTypeTable({
				field: "Fichiers_CSE[].Type",
				endpoint: DECLARATIONS_ENDPOINT,
				description: "Type des fichiers listés dans `Fichiers_CSE`.",
				presence:
					"Le bloc `Fichiers_CSE` est absent si aucun fichier d'avis CSE n'a été déposé.",
				types: ["cse_opinion"],
			}),
			buildFileTypeTable({
				field: "Fichier_evaluation_conjointe.Type",
				endpoint: DECLARATIONS_ENDPOINT,
				description: "Type du fichier d'évaluation conjointe.",
				presence:
					"Le bloc `Fichier_evaluation_conjointe` est absent si aucun rapport n'a été déposé.",
				types: ["joint_evaluation"],
			}),
			buildFileTypeTable({
				field: "files[].type",
				endpoint: FILES_ENDPOINT,
				description:
					"Type de fichier — nommé en minuscules, contrairement aux `Type` de l'export des déclarations.",
				presence: "Toujours présent sur chaque fichier listé.",
				types: fileTypeEnum.enumValues,
			}),
			buildCategorySourceTable(),
			buildSecondDeclarationStatusTable(),
		],
	};
}

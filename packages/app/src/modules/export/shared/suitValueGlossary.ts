// Submodule imports, not the barrels: `~/modules/cseOpinion` and
// `~/modules/declaration-remuneration` both re-export React components, which a
// pure derivation module has no business dragging in.
import type { ContentType, OpinionType } from "~/modules/cseOpinion/types";
import type { CATEGORY_SOURCES } from "~/modules/declaration-remuneration/steps/step5/sources";
import type {
	CompliancePathValue,
	DeclarationFsmStatus,
} from "~/modules/domain";
import type { fileTypeEnum } from "~/server/db/schema";
import type { DeclarationEventType } from "./statusHistoryLabels";

export type ActiveCategorySource = (typeof CATEGORY_SOURCES)[number]["value"];
export type FileType = (typeof fileTypeEnum.enumValues)[number];

export const FSM_STATUS_MEANINGS: Record<DeclarationFsmStatus, string> = {
	draft:
		"Déclaration commencée et non soumise. N'apparaît dans l'export que pour une déclaration annulée : un brouillon non annulé n'est jamais exporté.",
	awaiting_compliance_path_choice:
		"Déclaration soumise avec un écart d'au moins 5 % : l'entreprise doit choisir son parcours de mise en conformité.",
	corrective_actions_chosen:
		"Parcours « actions correctives » choisi après la première déclaration ; une seconde déclaration est attendue.",
	joint_evaluation_chosen:
		"Parcours « évaluation conjointe » choisi après la première déclaration ; le rapport est attendu.",
	awaiting_revision_choice:
		"Seconde déclaration soumise avec un écart persistant : l'entreprise doit choisir un second parcours.",
	revised_joint_evaluation_chosen:
		"Parcours « évaluation conjointe » choisi après la seconde déclaration ; le rapport est attendu.",
	awaiting_cse_opinion: "Le ou les avis du CSE sont attendus.",
	demarche_completed:
		"Aucune action supplémentaire n'est attendue sur Egapro. Ne pas confondre avec l'événement `demarche_complete` de `Historique_statuts[].Statut`, qui ne diffère que d'une lettre.",
};

export const EVENT_TYPE_MEANINGS: Record<DeclarationEventType, string> = {
	submit: "Soumission de la déclaration initiale.",
	path_choice:
		"Choix d'un parcours de mise en conformité. Seul événement à porter `Numero_declaration`.",
	second_declaration_submit: "Soumission de la seconde déclaration.",
	joint_evaluation_submit: "Dépôt du rapport d'évaluation conjointe.",
	cse_opinion_submit: "Dépôt d'un avis du CSE.",
	cancel: "Annulation de la déclaration.",
	demarche_complete:
		"Fin de la démarche. Ne pas confondre avec l'état `demarche_completed` de `Parcours.Statut`, qui ne diffère que d'une lettre.",
};

export const COMPLIANCE_PATH_MEANINGS: Record<CompliancePathValue, string> = {
	justify:
		"L'entreprise justifie l'écart constaté ; aucun dépôt supplémentaire n'est attendu sur Egapro à ce titre.",
	corrective_action:
		"L'entreprise engage des actions correctives, puis dépose une seconde déclaration.",
	joint_evaluation:
		"L'entreprise procède à une évaluation conjointe des rémunérations et en dépose le rapport.",
};

export const CSE_OPINION_CONTENT_TYPE_LABELS: Record<ContentType, string> = {
	accuracy: "Exactitude des données",
	gap: "Mesures de correction de l'écart",
};

export const CSE_OPINION_CONTENT_TYPE_MEANINGS: Record<ContentType, string> = {
	accuracy:
		"Avis rendu par le CSE sur l'exactitude des données déclarées pour la déclaration visée.",
	gap: "Avis rendu par le CSE sur les mesures de correction de l'écart de rémunération.",
};

export const OPINION_TYPE_LABELS: Record<OpinionType, string> = {
	favorable: "Favorable",
	unfavorable: "Défavorable",
};

export const OPINION_TYPE_MEANINGS: Record<OpinionType, string> = {
	favorable: "Le CSE a rendu un avis favorable.",
	unfavorable: "Le CSE a rendu un avis défavorable.",
};

export const FILE_TYPE_LABELS: Record<FileType, string> = {
	cse_opinion: "Avis du CSE",
	joint_evaluation: "Évaluation conjointe",
};

export const FILE_TYPE_MEANINGS: Record<FileType, string> = {
	cse_opinion:
		"PDF d'avis du CSE déposé par l'entreprise (jusqu'à 4 par an, entreprises d'au moins 100 salariés).",
	joint_evaluation:
		"PDF du rapport d'évaluation conjointe des rémunérations déposé par l'entreprise.",
};

export const ACTIVE_CATEGORY_SOURCE_MEANINGS: Record<
	ActiveCategorySource,
	string
> = {
	"accord-entreprise":
		"Les catégories d'emplois sont celles d'un accord d'entreprise.",
	"accord-groupe":
		"Les catégories d'emplois sont celles d'un accord de groupe.",
	"accord-branche":
		"Les catégories d'emplois sont celles d'un accord de branche.",
	"decision-unilaterale":
		"Les catégories d'emplois résultent d'une décision unilatérale de l'employeur.",
};

export const LEGACY_CATEGORY_SOURCE_MEANING =
	"Valeur historique : le choix a été retiré du formulaire, mais la colonne n'a jamais été migrée et l'export sert la valeur brute. Un consommateur qui valide strictement doit l'accepter.";

export type SuitHomonym = {
	name: string;
	occurrences: { field: string; meaning: string }[];
};

export const HOMONYMS: SuitHomonym[] = [
	{
		name: "Statut",
		occurrences: [
			{
				field: "`Parcours.Statut`",
				meaning: "État courant dans la machine à états.",
			},
			{
				field: "`Historique_statuts[].Statut`",
				meaning: "Type d'événement d'une ligne d'historique.",
			},
			{
				field: "`Seconde_declaration.Statut`",
				meaning: "Booléen : la seconde déclaration a-t-elle été soumise.",
			},
		],
	},
	{
		name: "Type / type",
		occurrences: [
			{
				field: "`Avis_CSE[].Type`",
				meaning: "Objet de la consultation du CSE.",
			},
			{
				field: "`Fichiers_CSE[].Type`",
				meaning: "Type du fichier d'avis CSE.",
			},
			{
				field: "`Fichier_evaluation_conjointe.Type`",
				meaning: "Type du fichier d'évaluation conjointe.",
			},
			{
				field: "`files[].type`",
				meaning:
					"Type de fichier servi par `GET /api/v1/files` — en minuscules, contrairement aux trois autres.",
			},
		],
	},
	{
		name: "Numero_declaration",
		occurrences: [
			{
				field: "`Historique_statuts[].Numero_declaration`",
				meaning: "Tour du choix de parcours.",
			},
			{
				field: "`Avis_CSE[].Numero_declaration`",
				meaning: "Déclaration visée par l'avis.",
			},
		],
	},
	{
		name: "demarche_complete / demarche_completed",
		occurrences: [
			{
				field: "`demarche_complete` (`Historique_statuts[].Statut`)",
				meaning: "Événement de fin de démarche.",
			},
			{
				field: "`demarche_completed` (`Parcours.Statut`)",
				meaning: "État terminal de la machine à états.",
			},
		],
	},
];

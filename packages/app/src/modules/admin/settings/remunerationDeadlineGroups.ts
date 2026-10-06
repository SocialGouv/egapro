import type { RemunerationDeadlinesFormInput } from "./schemas";

export type DeadlineKey = Exclude<keyof RemunerationDeadlinesFormInput, "year">;

export type DeadlineGroup = {
	legend: string;
	pathChoiceKey?: "pathChoiceRound1Deadline" | "pathChoiceDeadline";
	fields: readonly DeadlineKey[];
};

export const DEADLINE_GROUPS: readonly DeadlineGroup[] = [
	{
		legend: "Déclaration des indicateurs",
		fields: ["decl1ModificationDeadline"],
	},
	{
		legend: "Parcours de mise en conformité — 1er tour",
		pathChoiceKey: "pathChoiceRound1Deadline",
		fields: [
			"decl1JustificationDeadline",
			"decl1JointEvaluationDeadline",
			"decl2ModificationDeadline",
		],
	},
	{
		legend: "Parcours de mise en conformité — 2nd tour",
		pathChoiceKey: "pathChoiceDeadline",
		fields: ["decl2JustificationDeadline", "decl2JointEvaluationDeadline"],
	},
	{
		legend: "Avis du CSE",
		fields: ["decl2CseOpinionDeadline"],
	},
];

export const FIELD_LABELS: Record<DeadlineKey, string> = {
	decl1ModificationDeadline: "Échéance de déclaration",
	decl1JustificationDeadline: "Échéance de justification des écarts",
	decl1JointEvaluationDeadline:
		"Échéance de dépôt du rapport d'évaluation conjointe",
	decl2ModificationDeadline:
		"Échéance de la seconde déclaration (actions correctives)",
	decl2JustificationDeadline: "Échéance de justification des écarts",
	decl2JointEvaluationDeadline:
		"Échéance de dépôt du rapport d'évaluation conjointe",
	decl2CseOpinionDeadline: "Échéance de dépôt de l'avis du CSE",
};

export const FIELD_HINTS: Partial<Record<DeadlineKey, string>> = {
	decl2CseOpinionDeadline:
		"S'applique à toutes les entreprises soumises à l'avis du CSE, quel que soit le parcours.",
};

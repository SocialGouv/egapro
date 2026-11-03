import type { RemunerationDeadlinesFormInput } from "./schemas";

export type DeadlineKey = Exclude<keyof RemunerationDeadlinesFormInput, "year">;

export type DeadlineGroup = {
	legend: string;
	pathChoiceKey?: "pathChoiceRound1Deadline" | "pathChoiceDeadline";
	showsGipPublicationDate?: true;
	fields: readonly DeadlineKey[];
};

export const DEADLINE_GROUPS: readonly DeadlineGroup[] = [
	{
		legend: "Déclaration des indicateurs",
		showsGipPublicationDate: true,
		fields: ["decl1ModificationDeadline"],
	},
	{
		legend: "Parcours de mise en conformité — 1er tour",
		pathChoiceKey: "pathChoiceRound1Deadline",
		fields: ["decl1JointEvaluationDeadline", "decl2ModificationDeadline"],
	},
	{
		legend: "Parcours de mise en conformité — 2nd tour",
		pathChoiceKey: "pathChoiceDeadline",
		fields: ["decl2JointEvaluationDeadline"],
	},
	{
		legend: "Avis du CSE",
		fields: ["decl2CseOpinionDeadline"],
	},
];

export const FIELD_LABELS: Record<DeadlineKey, string> = {
	decl1ModificationDeadline: "Échéance de la déclaration",
	decl1JointEvaluationDeadline:
		"Échéance pour le dépôt du rapport de l'évaluation conjointe",
	decl2ModificationDeadline:
		"Échéance de la seconde déclaration (actions correctives)",
	decl2JointEvaluationDeadline:
		"Échéance pour le dépôt du rapport de l'évaluation conjointe",
	decl2CseOpinionDeadline: "Échéance pour le dépôt de l'avis ou des avis CSE",
};

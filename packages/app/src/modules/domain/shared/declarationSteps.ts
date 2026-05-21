/**
 * Labels FR du stepper Indicateurs A–F de la déclaration.
 *
 * Source de vérité unique pour mapper `declarations.current_step` (entier 0..6)
 * vers un libellé lisible — utilisé par le KPI K4 « délai moyen par étape » et
 * tout futur consommateur (export, dashboard, etc.).
 *
 * Aligné sur `STEP_TITLES` du module `declaration-remuneration` mais isomorphe
 * (zéro dépendance React) pour pouvoir être consommé côté serveur (router
 * admin) comme côté client (composants Recharts).
 */
export const DECLARATION_STEPS = [
	{ step: 0, label: "Introduction" },
	{ step: 1, label: "Effectifs" },
	{ step: 2, label: "Écart de rémunération" },
	{ step: 3, label: "Écart de rémunération variable" },
	{ step: 4, label: "Quartiles de rémunération" },
	{ step: 5, label: "Écart par catégorie de salariés" },
	{ step: 6, label: "Récapitulatif" },
] as const;

export type DeclarationStepNumber = (typeof DECLARATION_STEPS)[number]["step"];

const STEP_LABEL_BY_NUMBER: ReadonlyMap<number, string> = new Map(
	DECLARATION_STEPS.map((entry) => [entry.step, entry.label]),
);

export function getStepLabel(step: number): string {
	return STEP_LABEL_BY_NUMBER.get(step) ?? `Étape ${step}`;
}

/**
 * Jalons post-soumission de la déclaration — étendent le KPI K4 au-delà des
 * 7 étapes du wizard A–F. Ces jalons couvrent la « démarche complète » : choix
 * du parcours de conformité, actions correctives (seconde déclaration ou
 * évaluation conjointe), avis du CSE, et clôture.
 *
 * Chaque jalon mesure la durée entre deux événements de
 * `declaration_status_history`. L'ordre du tableau reflète la chronologie
 * typique et est conservé tel quel par les consommateurs (chart + table).
 */
export const POST_SUBMIT_MILESTONES = [
	{
		key: "submit_to_path_choice",
		label: "Délai avant choix du parcours",
	},
	{
		key: "path_choice_to_second_declaration",
		label: "Temps passé sur la seconde déclaration",
	},
	{
		key: "path_choice_to_joint_evaluation",
		label: "Temps passé sur l'évaluation conjointe",
	},
	{
		key: "action_to_cse_opinion",
		label: "Temps passé sur l'avis CSE",
	},
] as const;

export type PostSubmitMilestoneKey =
	(typeof POST_SUBMIT_MILESTONES)[number]["key"];

export const DROPOFF_RATE_ALERT_THRESHOLD = 15;
export const DROPOFF_STAGNATION_DAYS_DEFAULT = 30;
export const DROPOFF_STAGNATION_DAYS_MIN = 1;
export const DROPOFF_STAGNATION_DAYS_MAX = 180;

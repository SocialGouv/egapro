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

export const POST_SUBMIT_DROPOFF_PHASES = [
	{
		key: "awaiting_compliance_path_choice",
		label: "Choix parcours conformité",
		status: "awaiting_compliance_path_choice",
	},
	{
		key: "corrective_actions_chosen",
		label: "Seconde déclaration (corrective)",
		status: "corrective_actions_chosen",
	},
	{
		key: "joint_evaluation_chosen",
		label: "Évaluation conjointe",
		status: "joint_evaluation_chosen",
	},
	{
		key: "awaiting_revision_choice",
		label: "Choix de révision",
		status: "awaiting_revision_choice",
	},
	{
		key: "revised_joint_evaluation_chosen",
		label: "Évaluation conjointe (révision)",
		status: "revised_joint_evaluation_chosen",
	},
	{
		key: "awaiting_cse_opinion",
		label: "Avis CSE",
		status: "awaiting_cse_opinion",
	},
] as const;

export type PostSubmitDropoffPhaseKey =
	(typeof POST_SUBMIT_DROPOFF_PHASES)[number]["key"];

/**
 * Funnel jalons for KPI K19 « funnel de complétion ».
 *
 * Three ordered, immutable arrays — one per funnel rendered on the
 * `/admin/stats/plateforme` page. Each entry pairs a stable `key` (used as
 * React key and SQL column alias) with its French label. The ordering reflects
 * the chronology of the declaration journey and is preserved by every
 * consumer (chart, table, SQL output).
 *
 * - Main funnel — all declarations of a campaign year.
 * - Compliance funnel — sub-population that crossed the alert threshold and
 *   was offered a compliance path.
 * - Revision funnel — sub-population that re-entered a revision cycle after
 *   their second declaration did not lift the alert.
 *
 * `FUNNEL_DROP_ALERT_THRESHOLD` is the % drop between two consecutive jalons
 * above which the chart colors the bar in DSFR red marianne, surfacing a
 * sharp drop-off for DGT analysts.
 */
export const FUNNEL_MAIN_KEY_STEPS = [
	{ key: "draft_started", label: "Brouillon créé" },
	{ key: "indicators_filled", label: "Indicateurs saisis" },
	{ key: "submitted", label: "Déclaration soumise" },
	{ key: "demarche_completed", label: "Démarche complète" },
] as const;

export const FUNNEL_COMPLIANCE_KEY_STEPS = [
	{ key: "submitted_with_alert", label: "Soumise (écart ≥ 5 %)" },
	{ key: "path_chosen", label: "Parcours conformité choisi" },
	{ key: "corrective_action_submitted", label: "Action soumise" },
	{ key: "demarche_completed", label: "Démarche complète" },
] as const;

export const FUNNEL_REVISION_KEY_STEPS = [
	{ key: "revision_required", label: "Révision requise" },
	{ key: "revision_path_chosen", label: "Choix de révision fait" },
	{
		key: "revision_action_submitted",
		label: "Action de révision soumise",
	},
	{ key: "demarche_completed", label: "Démarche complète" },
] as const;

export const FUNNEL_CSE_KEY_STEPS = [
	{ key: "draft_started", label: "Brouillon créé" },
	{ key: "indicators_filled", label: "Indicateurs saisis" },
	{ key: "submitted", label: "Déclaration soumise" },
	{ key: "cse_opinion_submitted", label: "Avis CSE soumis" },
	{ key: "demarche_completed", label: "Démarche complète" },
] as const;

export type FunnelMainStepKey = (typeof FUNNEL_MAIN_KEY_STEPS)[number]["key"];
export type FunnelComplianceStepKey =
	(typeof FUNNEL_COMPLIANCE_KEY_STEPS)[number]["key"];
export type FunnelRevisionStepKey =
	(typeof FUNNEL_REVISION_KEY_STEPS)[number]["key"];
export type FunnelCseStepKey = (typeof FUNNEL_CSE_KEY_STEPS)[number]["key"];

/** % drop between two consecutive jalons above which the bar is colored red. */
export const FUNNEL_DROP_ALERT_THRESHOLD = 30;

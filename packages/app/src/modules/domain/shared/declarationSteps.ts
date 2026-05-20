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

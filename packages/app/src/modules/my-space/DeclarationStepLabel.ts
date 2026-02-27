const STEP_LABELS: Record<number, string> = {
	0: "Non commencée",
	1: "Effectifs par catégorie",
	2: "Rémunération de base",
	3: "Écart de rémunération",
	4: "Répartition par quartile",
	5: "Catégories personnalisées",
	6: "Complétée",
};

/** Returns a French label describing the current step of a declaration. */
export function getDeclarationStepLabel(currentStep: number): string {
	if (currentStep === 0) return "-";
	return STEP_LABELS[currentStep] ?? "-";
}

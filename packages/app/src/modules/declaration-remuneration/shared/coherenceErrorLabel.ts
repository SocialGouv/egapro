type WorkforceCoherenceReference = {
	table: "annual" | "hourly";
	field: "women" | "men";
	expected: number;
};

export function coherenceErrorLabel(
	error: WorkforceCoherenceReference,
): string {
	const sexLabel = error.field === "women" ? "de femmes" : "d'hommes";
	const tableAdjective = error.table === "annual" ? "annuel" : "horaire";
	return `Le nombre total ${sexLabel} renseigné ne correspond pas au nombre indiqué dans le tableau « Effectifs physiques pris en compte pour le calcul des indicateurs » (nombre total ${tableAdjective} : ${error.expected}).`;
}

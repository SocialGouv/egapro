/**
 * Help bubbles of the observatory, transcribed from the Figma annotations of
 * the "Observatoire" canvas. One entry per bubble the maquette draws — the
 * texts live here rather than next to each card so the wording stays reviewable
 * as a whole and a card cannot quietly drift from the maquette.
 */
export const INDICATOR_TOOLTIPS = {
	workforce:
		"Effectif physique pour le calcul des indicateurs sur la période de référence",

	globalHourlyMean:
		"Écart = (Rémunération horaire brute moyenne des hommes − celle des femmes) ÷ celle des hommes × 100",
	globalHourlyMedian:
		"Écart = (Rémunération horaire brute médiane des hommes − celle des femmes) ÷ celle des hommes × 100",
	globalAnnualMean:
		"Écart = (Rémunération annuelle brute moyenne des hommes − celle des femmes) ÷ celle des hommes × 100",
	globalAnnualMedian:
		"Écart = (Rémunération annuelle brute médiane des hommes − celle des femmes) ÷ celle des hommes × 100",

	variableHourlyMean:
		"Écart = (Rémunération variable horaire moyenne des hommes − celle des femmes) ÷ celle des hommes × 100",
	variableHourlyMedian:
		"Écart = (Rémunération variable horaire médiane des hommes − celle des femmes) ÷ celle des hommes × 100",
	variableAnnualMean:
		"Écart = (Rémunération variable annuelle moyenne des hommes − celle des femmes) ÷ celle des hommes × 100",
	variableAnnualMedian:
		"Écart = (Rémunération variable annuelle médiane des hommes − celle des femmes) ÷ celle des hommes × 100",

	variableBeneficiaries:
		"Proportion = nombre de bénéficiaires ÷ effectif total, par sexe × 100",

	annualQuartiles:
		"Les salariés sont classés par rémunération annuelle et répartis en 4 groupes égaux, du moins payé (1er quartile) au mieux payé (4e quartile)",
	hourlyQuartiles:
		"Les salariés sont classés par rémunération horaire et répartis en 4 groupes égaux, du moins payé (1er quartile) au mieux payé (4e quartile)",

	executives:
		"Pourcentage = nombre de cadres dirigeants de chaque sexe ÷ total des cadres dirigeants × 100",
	// The Figma annotation divides by "total des cadres dirigeants" here too,
	// which is a copy of the line above rather than the definition of this
	// indicator. Published as the correct denominator; revert if the designer
	// confirms the maquette's wording is intentional.
	members:
		"Pourcentage = nombre de membres des instances dirigeantes de chaque sexe ÷ total des membres des instances dirigeantes × 100",
} as const;

export type IndicatorTooltipKey = keyof typeof INDICATOR_TOOLTIPS;

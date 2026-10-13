import type { PublicDeclarationDTO } from "./schemas";

const CSV_COLUMN_PAIRS = [
	["year", "Annee_declaration"],
	["siren", "SIREN"],
	["name", "Raison_sociale"],
	["address", "Adresse"],
	["region", "Region"],
	["departmentCode", "Code_departement"],
	["departmentLabel", "Departement"],
	["nafCode", "Code_NAF"],
	["nafLabel", "Libelle_NAF"],
	["countryLabel", "Pays"],
	["workforceEma", "Effectif_RCD"],
	["totalWomen", "Effectif_F_rem_annuelle_globale"],
	["totalMen", "Effectif_H_rem_annuelle_globale"],
	["globalAnnualMeanGap", "Rem_globale_annuelle_moyenne_ecart"],
	["globalAnnualMedianGap", "Rem_globale_annuelle_mediane_ecart"],
	["globalHourlyMeanGap", "Taux_horaire_global_moyen_ecart"],
	["globalHourlyMedianGap", "Taux_horaire_global_median_ecart"],
	["variableAnnualMeanGap", "Rem_variable_annuelle_moyenne_ecart"],
	["variableAnnualMedianGap", "Rem_variable_annuelle_mediane_ecart"],
	["variableHourlyMeanGap", "Taux_horaire_variable_moyen_ecart"],
	["variableHourlyMedianGap", "Taux_horaire_variable_median_ecart"],
	["variableProportionWomen", "Proportion_variable_F"],
	["variableProportionMen", "Proportion_variable_H"],
	[
		"annualQuartile1ProportionWomen",
		"Quartile1_Rem_globale_annuelle_proportion_F",
	],
	[
		"annualQuartile2ProportionWomen",
		"Quartile2_Rem_globale_annuelle_proportion_F",
	],
	[
		"annualQuartile3ProportionWomen",
		"Quartile3_Rem_globale_annuelle_proportion_F",
	],
	[
		"annualQuartile4ProportionWomen",
		"Quartile4_Rem_globale_annuelle_proportion_F",
	],
	[
		"annualQuartile1ProportionMen",
		"Quartile1_Rem_globale_annuelle_proportion_H",
	],
	[
		"annualQuartile2ProportionMen",
		"Quartile2_Rem_globale_annuelle_proportion_H",
	],
	[
		"annualQuartile3ProportionMen",
		"Quartile3_Rem_globale_annuelle_proportion_H",
	],
	[
		"annualQuartile4ProportionMen",
		"Quartile4_Rem_globale_annuelle_proportion_H",
	],
	[
		"hourlyQuartile1ProportionWomen",
		"Quartile1_Taux_horaire_global_proportion_F",
	],
	[
		"hourlyQuartile2ProportionWomen",
		"Quartile2_Taux_horaire_global_proportion_F",
	],
	[
		"hourlyQuartile3ProportionWomen",
		"Quartile3_Taux_horaire_global_proportion_F",
	],
	[
		"hourlyQuartile4ProportionWomen",
		"Quartile4_Taux_horaire_global_proportion_F",
	],
	[
		"hourlyQuartile1ProportionMen",
		"Quartile1_Taux_horaire_global_proportion_H",
	],
	[
		"hourlyQuartile2ProportionMen",
		"Quartile2_Taux_horaire_global_proportion_H",
	],
	[
		"hourlyQuartile3ProportionMen",
		"Quartile3_Taux_horaire_global_proportion_H",
	],
	[
		"hourlyQuartile4ProportionMen",
		"Quartile4_Taux_horaire_global_proportion_H",
	],
] satisfies Array<[keyof PublicDeclarationDTO, string]>;

export const CSV_COLUMNS = CSV_COLUMN_PAIRS.map(([key, header]) => ({
	key,
	header,
}));

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
	...(["annual", "hourly"] as const).flatMap((period) =>
		(["Women", "Men"] as const).flatMap((gender) =>
			([1, 2, 3, 4] as const).map(
				(quartile) =>
					[
						`${period}Quartile${quartile}Proportion${gender}`,
						`Quartile${quartile}_${period === "annual" ? "Rem_globale_annuelle" : "Taux_horaire_global"}_proportion_${gender === "Women" ? "F" : "H"}`,
					] satisfies [keyof PublicDeclarationDTO, string],
			),
		),
	),
] satisfies Array<[keyof PublicDeclarationDTO, string]>;

export const CSV_COLUMNS = CSV_COLUMN_PAIRS.map(([key, header]) => ({
	key,
	header,
}));

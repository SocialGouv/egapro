import type { PublicDeclarationDTO } from "./schemas";

export const XLSX_HEADERS: Array<keyof PublicDeclarationDTO> = [
	"year",
	"siren",
	"name",
	"address",
	"city",
	"regionCode",
	"region",
	"departmentCode",
	"departmentLabel",
	"countryCode",
	"countryLabel",
	"nafCode",
	"nafLabel",
	"workforceEma",
	"totalWomen",
	"totalMen",
	"globalAnnualMeanGap",
	"globalAnnualMedianGap",
	"globalHourlyMeanGap",
	"globalHourlyMedianGap",
	"variableAnnualMeanGap",
	"variableAnnualMedianGap",
	"variableHourlyMeanGap",
	"variableHourlyMedianGap",
	"variableProportionWomen",
	"variableProportionMen",
	"annualQuartile1ProportionWomen",
	"annualQuartile2ProportionWomen",
	"annualQuartile3ProportionWomen",
	"annualQuartile4ProportionWomen",
	"annualQuartile1ProportionMen",
	"annualQuartile2ProportionMen",
	"annualQuartile3ProportionMen",
	"annualQuartile4ProportionMen",
	"hourlyQuartile1ProportionWomen",
	"hourlyQuartile2ProportionWomen",
	"hourlyQuartile3ProportionWomen",
	"hourlyQuartile4ProportionWomen",
	"hourlyQuartile1ProportionMen",
	"hourlyQuartile2ProportionMen",
	"hourlyQuartile3ProportionMen",
	"hourlyQuartile4ProportionMen",
];

export const CSV_COLUMNS: Array<{
	key: keyof PublicDeclarationDTO;
	header: string;
}> = [
	{ key: "year", header: "Annee_declaration" },
	{ key: "siren", header: "SIREN" },
	{ key: "name", header: "Raison_sociale" },
	{ key: "address", header: "Adresse" },
	{ key: "region", header: "Region" },
	{ key: "departmentCode", header: "Code_departement" },
	{ key: "departmentLabel", header: "Departement" },
	{ key: "nafCode", header: "Code_NAF" },
	{ key: "nafLabel", header: "Libelle_NAF" },
	{ key: "countryLabel", header: "Pays" },
	{ key: "workforceEma", header: "Effectif_RCD" },
	{ key: "totalWomen", header: "Effectif_F_rem_annuelle_globale" },
	{ key: "totalMen", header: "Effectif_H_rem_annuelle_globale" },
	{
		key: "globalAnnualMeanGap",
		header: "Rem_globale_annuelle_moyenne_ecart",
	},
	{
		key: "globalAnnualMedianGap",
		header: "Rem_globale_annuelle_mediane_ecart",
	},
	{ key: "globalHourlyMeanGap", header: "Taux_horaire_global_moyen_ecart" },
	{
		key: "globalHourlyMedianGap",
		header: "Taux_horaire_global_median_ecart",
	},
	{
		key: "variableAnnualMeanGap",
		header: "Rem_variable_annuelle_moyenne_ecart",
	},
	{
		key: "variableAnnualMedianGap",
		header: "Rem_variable_annuelle_mediane_ecart",
	},
	{
		key: "variableHourlyMeanGap",
		header: "Taux_horaire_variable_moyen_ecart",
	},
	{
		key: "variableHourlyMedianGap",
		header: "Taux_horaire_variable_median_ecart",
	},
	{ key: "variableProportionWomen", header: "Proportion_variable_F" },
	{ key: "variableProportionMen", header: "Proportion_variable_H" },
	{
		key: "annualQuartile1ProportionWomen",
		header: "Quartile1_Rem_globale_annuelle_proportion_F",
	},
	{
		key: "annualQuartile2ProportionWomen",
		header: "Quartile2_Rem_globale_annuelle_proportion_F",
	},
	{
		key: "annualQuartile3ProportionWomen",
		header: "Quartile3_Rem_globale_annuelle_proportion_F",
	},
	{
		key: "annualQuartile4ProportionWomen",
		header: "Quartile4_Rem_globale_annuelle_proportion_F",
	},
	{
		key: "annualQuartile1ProportionMen",
		header: "Quartile1_Rem_globale_annuelle_proportion_H",
	},
	{
		key: "annualQuartile2ProportionMen",
		header: "Quartile2_Rem_globale_annuelle_proportion_H",
	},
	{
		key: "annualQuartile3ProportionMen",
		header: "Quartile3_Rem_globale_annuelle_proportion_H",
	},
	{
		key: "annualQuartile4ProportionMen",
		header: "Quartile4_Rem_globale_annuelle_proportion_H",
	},
	{
		key: "hourlyQuartile1ProportionWomen",
		header: "Quartile1_Taux_horaire_global_proportion_F",
	},
	{
		key: "hourlyQuartile2ProportionWomen",
		header: "Quartile2_Taux_horaire_global_proportion_F",
	},
	{
		key: "hourlyQuartile3ProportionWomen",
		header: "Quartile3_Taux_horaire_global_proportion_F",
	},
	{
		key: "hourlyQuartile4ProportionWomen",
		header: "Quartile4_Taux_horaire_global_proportion_F",
	},
	{
		key: "hourlyQuartile1ProportionMen",
		header: "Quartile1_Taux_horaire_global_proportion_H",
	},
	{
		key: "hourlyQuartile2ProportionMen",
		header: "Quartile2_Taux_horaire_global_proportion_H",
	},
	{
		key: "hourlyQuartile3ProportionMen",
		header: "Quartile3_Taux_horaire_global_proportion_H",
	},
	{
		key: "hourlyQuartile4ProportionMen",
		header: "Quartile4_Taux_horaire_global_proportion_H",
	},
];

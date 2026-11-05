import type { PublicDeclarationDTO } from "./schemas";

export type CsvColumn = {
	key: keyof PublicDeclarationDTO;
	header: string;
	/** Ratio (`0.074`) rendered in the CSV as percentage points (`7.4`). See `ratioToPercentPoints`. */
	percent?: true;
};

const CSV_COLUMN_DEFINITIONS: CsvColumn[] = [
	{ key: "year", header: "Annee_declaration" },
	{ key: "siren", header: "SIREN" },
	{ key: "name", header: "Raison_sociale" },
	{ key: "address", header: "Adresse" },
	{ key: "region", header: "Region" },
	{ key: "departmentCode", header: "Code_departement" },
	{ key: "departmentLabel", header: "Departement" },
	{ key: "countryLabel", header: "Pays" },
	{ key: "nafCode", header: "Code_NAF" },
	{ key: "nafLabel", header: "Libelle_NAF" },
	{ key: "workforceEma", header: "Effectif_annuel_moyen" },
	{ key: "totalWomen", header: "Effectif_F_rem_annuelle" },
	{ key: "totalMen", header: "Effectif_H_rem_annuelle" },
	{ key: "hourlyWomen", header: "Effectif_F_rem_horaire" },
	{ key: "hourlyMen", header: "Effectif_H_rem_horaire" },
	{
		key: "globalAnnualMeanGap",
		header: "Ecart_rem_annuelle_moyenne",
		percent: true,
	},
	{
		key: "globalAnnualMedianGap",
		header: "Ecart_rem_annuelle_mediane",
		percent: true,
	},
	{
		key: "globalHourlyMeanGap",
		header: "Ecart_rem_horaire_moyenne",
		percent: true,
	},
	{
		key: "globalHourlyMedianGap",
		header: "Ecart_rem_horaire_mediane",
		percent: true,
	},
	{
		key: "variableAnnualMeanGap",
		header: "Ecart_rem_variable_annuelle_moyenne",
		percent: true,
	},
	{
		key: "variableAnnualMedianGap",
		header: "Ecart_rem_variable_annuelle_mediane",
		percent: true,
	},
	{
		key: "variableHourlyMeanGap",
		header: "Ecart_rem_variable_horaire_moyenne",
		percent: true,
	},
	{
		key: "variableHourlyMedianGap",
		header: "Ecart_rem_variable_horaire_mediane",
		percent: true,
	},
	{
		key: "variableProportionWomen",
		header: "Proportion_variable_F",
		percent: true,
	},
	{
		key: "variableProportionMen",
		header: "Proportion_variable_H",
		percent: true,
	},
	...(["annual", "hourly"] as const).flatMap((period) =>
		(["Women", "Men"] as const).flatMap((gender) =>
			([1, 2, 3, 4] as const).map(
				(quartile) =>
					({
						key: `${period}Quartile${quartile}Proportion${gender}`,
						header: `Quartile${quartile}_${period === "annual" ? "rem_annuelle" : "rem_horaire"}_proportion_${gender === "Women" ? "F" : "H"}`,
						percent: true,
					}) satisfies CsvColumn,
			),
		),
	),
];

export const CSV_COLUMNS = CSV_COLUMN_DEFINITIONS;

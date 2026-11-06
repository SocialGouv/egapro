import type { PublicDeclarationDTO } from "./schemas";

export type CsvColumn = {
	key: keyof PublicDeclarationDTO;
	header: string;
	/** Ratio (`0.074`) rendered in the CSV as percentage points (`7.4`). See `ratioToPercentPoints`. */
	percent?: true;
};

/** Builds a ratio column: rendered in the CSV as percentage points (see `ratioToPercentPoints`). */
function percentColumn(key: CsvColumn["key"], header: string): CsvColumn {
	return { key, header, percent: true };
}

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
	percentColumn("globalAnnualMeanGap", "Ecart_rem_annuelle_moyenne"),
	percentColumn("globalAnnualMedianGap", "Ecart_rem_annuelle_mediane"),
	percentColumn("globalHourlyMeanGap", "Ecart_rem_horaire_moyenne"),
	percentColumn("globalHourlyMedianGap", "Ecart_rem_horaire_mediane"),
	percentColumn("variableAnnualMeanGap", "Ecart_rem_variable_annuelle_moyenne"),
	percentColumn(
		"variableAnnualMedianGap",
		"Ecart_rem_variable_annuelle_mediane",
	),
	percentColumn("variableHourlyMeanGap", "Ecart_rem_variable_horaire_moyenne"),
	percentColumn(
		"variableHourlyMedianGap",
		"Ecart_rem_variable_horaire_mediane",
	),
	percentColumn("variableProportionWomen", "Proportion_variable_F"),
	percentColumn("variableProportionMen", "Proportion_variable_H"),
	...(["annual", "hourly"] as const).flatMap((period) =>
		(["Women", "Men"] as const).flatMap((gender) =>
			([1, 2, 3, 4] as const).map((quartile) =>
				percentColumn(
					`${period}Quartile${quartile}Proportion${gender}`,
					`Quartile${quartile}_${period === "annual" ? "rem_annuelle" : "rem_horaire"}_proportion_${gender === "Women" ? "F" : "H"}`,
				),
			),
		),
	),
];

export const CSV_COLUMNS = CSV_COLUMN_DEFINITIONS;

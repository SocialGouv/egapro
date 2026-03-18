import type { ExportRow, IndicatorGRow } from "../types";

export const EXPORT_VERSION = "v1";

/** Declaration sheet column definition: key from ExportRow → French header label. */
export const DECLARATION_COLUMNS: Array<{
	key: keyof ExportRow;
	header: string;
}> = [
	// Company
	{ key: "siren", header: "SIREN" },
	{ key: "companyName", header: "Raison_sociale" },
	{ key: "workforce", header: "Effectif" },
	{ key: "nafCode", header: "Code_NAF" },
	{ key: "address", header: "Adresse" },
	{ key: "hasCse", header: "CSE_existant" },

	// Declaration
	{ key: "year", header: "Annee" },
	{ key: "status", header: "Statut" },
	{ key: "declarationType", header: "Type_declaration" },
	{ key: "compliancePath", header: "Parcours_conformite" },
	{ key: "createdAt", header: "Date_creation" },
	{ key: "updatedAt", header: "Date_modification" },

	// Employees
	{ key: "totalWomen", header: "Total_femmes" },
	{ key: "totalMen", header: "Total_hommes" },

	// Scores
	{ key: "remunerationScore", header: "Score_remuneration" },
	{ key: "variableRemunerationScore", header: "Score_remuneration_variable" },
	{ key: "quartileScore", header: "Score_quartile" },
	{ key: "categoryScore", header: "Score_categorie" },

	// Indicator A — Pay gap (step 2)
	{ key: "indAAnnualMeanWomen", header: "Ind_A_Annuel_Moy_F" },
	{ key: "indAAnnualMeanMen", header: "Ind_A_Annuel_Moy_H" },
	{ key: "indAHourlyMeanWomen", header: "Ind_A_Horaire_Moy_F" },
	{ key: "indAHourlyMeanMen", header: "Ind_A_Horaire_Moy_H" },
	{ key: "indAAnnualMedianWomen", header: "Ind_A_Annuel_Med_F" },
	{ key: "indAAnnualMedianMen", header: "Ind_A_Annuel_Med_H" },
	{ key: "indAHourlyMedianWomen", header: "Ind_A_Horaire_Med_F" },
	{ key: "indAHourlyMedianMen", header: "Ind_A_Horaire_Med_H" },

	// Indicator B — Variable pay gap (step 3)
	{ key: "indBAnnualMeanWomen", header: "Ind_B_Annuel_Moy_F" },
	{ key: "indBAnnualMeanMen", header: "Ind_B_Annuel_Moy_H" },
	{ key: "indBHourlyMeanWomen", header: "Ind_B_Horaire_Moy_F" },
	{ key: "indBHourlyMeanMen", header: "Ind_B_Horaire_Moy_H" },
	{ key: "indBAnnualMedianWomen", header: "Ind_B_Annuel_Med_F" },
	{ key: "indBAnnualMedianMen", header: "Ind_B_Annuel_Med_H" },
	{ key: "indBHourlyMedianWomen", header: "Ind_B_Horaire_Med_F" },
	{ key: "indBHourlyMedianMen", header: "Ind_B_Horaire_Med_H" },
	{ key: "indBBeneficiariesWomen", header: "Ind_B_Benef_F" },
	{ key: "indBBeneficiariesMen", header: "Ind_B_Benef_H" },

	// Indicator F — Quartile distribution (step 4)
	{ key: "indFAnnualQ1Women", header: "Ind_F_Annuel_Q1_F" },
	{ key: "indFAnnualQ1Men", header: "Ind_F_Annuel_Q1_H" },
	{ key: "indFAnnualQ1Threshold", header: "Ind_F_Annuel_Q1_seuil" },
	{ key: "indFAnnualQ2Women", header: "Ind_F_Annuel_Q2_F" },
	{ key: "indFAnnualQ2Men", header: "Ind_F_Annuel_Q2_H" },
	{ key: "indFAnnualQ2Threshold", header: "Ind_F_Annuel_Q2_seuil" },
	{ key: "indFAnnualQ3Women", header: "Ind_F_Annuel_Q3_F" },
	{ key: "indFAnnualQ3Men", header: "Ind_F_Annuel_Q3_H" },
	{ key: "indFAnnualQ3Threshold", header: "Ind_F_Annuel_Q3_seuil" },
	{ key: "indFAnnualQ4Women", header: "Ind_F_Annuel_Q4_F" },
	{ key: "indFAnnualQ4Men", header: "Ind_F_Annuel_Q4_H" },
	{ key: "indFAnnualQ4Threshold", header: "Ind_F_Annuel_Q4_seuil" },
	{ key: "indFHourlyQ1Women", header: "Ind_F_Horaire_Q1_F" },
	{ key: "indFHourlyQ1Men", header: "Ind_F_Horaire_Q1_H" },
	{ key: "indFHourlyQ1Threshold", header: "Ind_F_Horaire_Q1_seuil" },
	{ key: "indFHourlyQ2Women", header: "Ind_F_Horaire_Q2_F" },
	{ key: "indFHourlyQ2Men", header: "Ind_F_Horaire_Q2_H" },
	{ key: "indFHourlyQ2Threshold", header: "Ind_F_Horaire_Q2_seuil" },
	{ key: "indFHourlyQ3Women", header: "Ind_F_Horaire_Q3_F" },
	{ key: "indFHourlyQ3Men", header: "Ind_F_Horaire_Q3_H" },
	{ key: "indFHourlyQ3Threshold", header: "Ind_F_Horaire_Q3_seuil" },
	{ key: "indFHourlyQ4Women", header: "Ind_F_Horaire_Q4_F" },
	{ key: "indFHourlyQ4Men", header: "Ind_F_Horaire_Q4_H" },
	{ key: "indFHourlyQ4Threshold", header: "Ind_F_Horaire_Q4_seuil" },

	// Second declaration
	{ key: "secondDeclarationStatus", header: "Seconde_declaration_statut" },
	{
		key: "secondDeclReferencePeriodStart",
		header: "Seconde_declaration_periode_debut",
	},
	{
		key: "secondDeclReferencePeriodEnd",
		header: "Seconde_declaration_periode_fin",
	},

	// Declarant
	{ key: "declarantFirstName", header: "Declarant_prenom" },
	{ key: "declarantLastName", header: "Declarant_nom" },
	{ key: "declarantEmail", header: "Declarant_email" },
	{ key: "declarantPhone", header: "Declarant_telephone" },

	// CSE opinions
	{ key: "cseOpinion1Type", header: "Avis_CSE_1_type" },
	{ key: "cseOpinion1Opinion", header: "Avis_CSE_1_avis" },
	{ key: "cseOpinion1Date", header: "Avis_CSE_1_date" },
	{ key: "cseOpinion2Type", header: "Avis_CSE_2_type" },
	{ key: "cseOpinion2Opinion", header: "Avis_CSE_2_avis" },
	{ key: "cseOpinion2Date", header: "Avis_CSE_2_date" },
	{ key: "cseOpinion3Type", header: "Avis_CSE_3_type" },
	{ key: "cseOpinion3Opinion", header: "Avis_CSE_3_avis" },
	{ key: "cseOpinion3Date", header: "Avis_CSE_3_date" },
	{ key: "cseOpinion4Type", header: "Avis_CSE_4_type" },
	{ key: "cseOpinion4Opinion", header: "Avis_CSE_4_avis" },
	{ key: "cseOpinion4Date", header: "Avis_CSE_4_date" },
];

/** Indicator G sheet column definition. */
export const INDICATOR_G_COLUMNS: Array<{
	key: keyof IndicatorGRow;
	header: string;
}> = [
	{ key: "siren", header: "SIREN" },
	{ key: "companyName", header: "Raison_sociale" },
	{ key: "year", header: "Annee" },
	{ key: "declarationType", header: "Type_declaration" },
	{ key: "categoryIndex", header: "Index_categorie" },
	{ key: "categoryName", header: "Nom_categorie" },
	{ key: "categoryDetail", header: "Detail_categorie" },
	{ key: "categorySource", header: "Source" },
	{ key: "womenCount", header: "Effectif_F" },
	{ key: "menCount", header: "Effectif_H" },
	{ key: "annualBaseWomen", header: "Annuel_base_F" },
	{ key: "annualBaseMen", header: "Annuel_base_H" },
	{ key: "annualVariableWomen", header: "Annuel_variable_F" },
	{ key: "annualVariableMen", header: "Annuel_variable_H" },
	{ key: "hourlyBaseWomen", header: "Horaire_base_F" },
	{ key: "hourlyBaseMen", header: "Horaire_base_H" },
	{ key: "hourlyVariableWomen", header: "Horaire_variable_F" },
	{ key: "hourlyVariableMen", header: "Horaire_variable_H" },
];

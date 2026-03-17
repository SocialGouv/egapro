import type { ExportRow } from "../types";

export const EXPORT_VERSION = "v1";

/** CSV column definition: key from ExportRow → French header label. */
export const CSV_COLUMNS: Array<{ key: keyof ExportRow; header: string }> = [
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

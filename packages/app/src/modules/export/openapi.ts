// OpenAPI 3.1 specification for the declarations export API.

const declarantSchema = {
	type: "object",
	description: "Personne physique ayant réalisé la déclaration.",
	properties: {
		Prenom: { type: ["string", "null"] },
		Nom: { type: ["string", "null"] },
		Email: { type: ["string", "null"] },
		Telephone: { type: ["string", "null"] },
	},
} as const;

const indicatorGCategorySchema = {
	type: "object",
	description:
		"Catégorie socio-professionnelle déclarée par l'entreprise pour l'indicateur G.",
	properties: {
		Nom_categorie: {
			type: "string",
			description: "Libellé CSP (ex. 'Ouvriers', 'Ingénieurs et cadres')",
		},
		Effectif_F: { type: ["integer", "null"] },
		Effectif_H: { type: ["integer", "null"] },
		Rem_annuelle_base_F: { type: ["string", "null"] },
		Rem_annuelle_base_H: { type: ["string", "null"] },
		Rem_annuelle_variable_F: { type: ["string", "null"] },
		Rem_annuelle_variable_H: { type: ["string", "null"] },
		Taux_horaire_base_F: { type: ["string", "null"] },
		Taux_horaire_base_H: { type: ["string", "null"] },
		Taux_horaire_variable_F: { type: ["string", "null"] },
		Taux_horaire_variable_H: { type: ["string", "null"] },
	},
} as const;

const cseOpinionSchema = {
	type: "object",
	properties: {
		Numero_declaration: {
			type: "integer",
			enum: [1, 2],
			description:
				"Numéro de déclaration concernée par l'avis : 1 = déclaration initiale, 2 = seconde déclaration (requise si l'écart de rémunération atteint 5%)",
		},
		Type: {
			type: "string",
			enum: ["accuracy", "gap"],
			description:
				"Type d'avis CSE : 'accuracy' = avis sur l'exactitude des données, 'gap' = avis sur les mesures de correction de l'écart",
		},
		Avis: { type: ["string", "null"] },
		Date: { type: ["string", "null"], format: "date" },
	},
} as const;

const indicatorFAnnualSchema = {
	type: "object",
	description:
		"Répartition par quartile — rémunération globale annuelle. Seuils en euros (chaîne numérique) ; proportions F/H entre 0 et 1.",
	properties: {
		Seuil_Q1_Rem_globale: { type: ["string", "null"] },
		Quartile1_Rem_globale_annuelle_proportion_F: { type: ["number", "null"] },
		Quartile1_Rem_globale_annuelle_proportion_H: { type: ["number", "null"] },
		Seuil_Q2_Rem_globale: { type: ["string", "null"] },
		Quartile2_Rem_globale_annuelle_proportion_F: { type: ["number", "null"] },
		Quartile2_Rem_globale_annuelle_proportion_H: { type: ["number", "null"] },
		Seuil_Q3_Rem_globale: { type: ["string", "null"] },
		Quartile3_Rem_globale_annuelle_proportion_F: { type: ["number", "null"] },
		Quartile3_Rem_globale_annuelle_proportion_H: { type: ["number", "null"] },
		Seuil_Q4_Rem_globale: { type: ["string", "null"] },
		Quartile4_Rem_globale_annuelle_proportion_F: { type: ["number", "null"] },
		Quartile4_Rem_globale_annuelle_proportion_H: { type: ["number", "null"] },
	},
} as const;

const indicatorFHourlySchema = {
	type: "object",
	description:
		"Répartition par quartile — taux horaire global. Seuils en euros (chaîne numérique) ; proportions F/H entre 0 et 1.",
	properties: {
		Seuil_Q1_Taux_horaire_global: { type: ["string", "null"] },
		Quartile1_Taux_horaire_global_proportion_F: { type: ["number", "null"] },
		Quartile1_Taux_horaire_global_proportion_H: { type: ["number", "null"] },
		Seuil_Q2_Taux_horaire_global: { type: ["string", "null"] },
		Quartile2_Taux_horaire_global_proportion_F: { type: ["number", "null"] },
		Quartile2_Taux_horaire_global_proportion_H: { type: ["number", "null"] },
		Seuil_Q3_Taux_horaire_global: { type: ["string", "null"] },
		Quartile3_Taux_horaire_global_proportion_F: { type: ["number", "null"] },
		Quartile3_Taux_horaire_global_proportion_H: { type: ["number", "null"] },
		Seuil_Q4_Taux_horaire_global: { type: ["string", "null"] },
		Quartile4_Taux_horaire_global_proportion_F: { type: ["number", "null"] },
		Quartile4_Taux_horaire_global_proportion_H: { type: ["number", "null"] },
	},
} as const;

const indicatorsSchema = {
	type: "object",
	description:
		"Indicateurs A–F (pré-calculés par le GIP-MDS à partir des DSN) et indicateur G déclaré par l'entreprise. Les libellés des champs reprennent ceux du fichier GIP MDS.",
	properties: {
		A: {
			type: "object",
			description: "Rémunération globale moyenne (annuel + taux horaire)",
			properties: {
				Rem_globale_annuelle_moyenne_F: { type: ["string", "null"] },
				Rem_globale_annuelle_moyenne_H: { type: ["string", "null"] },
				Taux_horaire_global_moyen_F: { type: ["string", "null"] },
				Taux_horaire_global_moyen_H: { type: ["string", "null"] },
			},
		},
		B: {
			type: "object",
			description: "Rémunération variable moyenne (annuel + taux horaire)",
			properties: {
				Rem_variable_annuelle_moyenne_F: { type: ["string", "null"] },
				Rem_variable_annuelle_moyenne_H: { type: ["string", "null"] },
				Taux_horaire_variable_moyen_F: { type: ["string", "null"] },
				Taux_horaire_variable_moyen_H: { type: ["string", "null"] },
			},
		},
		C: {
			type: "object",
			description: "Rémunération globale médiane (annuel + taux horaire)",
			properties: {
				Rem_globale_annuelle_médiane_F: { type: ["string", "null"] },
				Rem_globale_annuelle_médiane_H: { type: ["string", "null"] },
				Taux_globale_annuelle_médiane_F: { type: ["string", "null"] },
				Taux_globale_annuelle_médiane_H: { type: ["string", "null"] },
			},
		},
		D: {
			type: "object",
			description: "Rémunération variable médiane (annuel + taux horaire)",
			properties: {
				Rem_variable_annuelle_médiane_F: { type: ["string", "null"] },
				Rem_variable_annuelle_médiane_H: { type: ["string", "null"] },
				Taux_horaire_variable_médian_F: { type: ["string", "null"] },
				Taux_horaire_variable_médian_H: { type: ["string", "null"] },
			},
		},
		E: {
			type: "object",
			description: "Effectifs bénéficiaires d'une rémunération variable",
			properties: {
				Effectif_F_rem_annuelle_variable: { type: ["string", "null"] },
				Effectif_H_rem_annuelle_variable: { type: ["string", "null"] },
			},
		},
		F: {
			type: "object",
			description:
				"Répartition par quartile de rémunération. Les proportions F/H reflètent la part de chaque genre dans le quartile (0 à 1).",
			properties: {
				annuel: indicatorFAnnualSchema,
				horaire: indicatorFHourlySchema,
			},
		},
		G: {
			oneOf: [
				{ type: "array", items: indicatorGCategorySchema },
				{ type: "null" },
			],
			description:
				"Écart de rémunération par CSP déclaré par l'entreprise. `null` si non déclaré.",
		},
	},
} as const;

const declarationSchema = {
	type: "object",
	properties: {
		id: {
			type: "string",
			format: "uuid",
			description: "Identifiant interne de la déclaration (UUID)",
			example: "11111111-2222-4333-8444-555555555555",
		},
		SIREN: {
			type: "string",
			description: "SIREN de l'entreprise (9 chiffres)",
			example: "319159877",
		},
		Raison_sociale: {
			type: ["string", "null"],
			example: "THALES LAS FRANCE SAS",
		},
		Effectif: {
			type: ["integer", "null"],
			description: "Effectif total",
			example: 7403,
		},
		Code_NAF: {
			type: ["string", "null"],
			description: "Code NAF/APE",
			example: "26.51A",
		},
		Adresse: {
			type: ["string", "null"],
			example: "2 AVENUE GAY-LUSSAC, 78990 ELANCOURT",
		},
		CSE_existant: {
			type: ["boolean", "null"],
			description: "Présence d'un CSE (>= 50 salariés)",
		},
		Annee: {
			type: "integer",
			description: "Année de la déclaration",
			example: 2026,
		},
		Statut: {
			type: "string",
			description: "Statut de la déclaration",
			example: "submitted",
		},
		Parcours_apres_declaration_1: {
			type: ["string", "null"],
			description:
				"Parcours après la première déclaration (justify, corrective_action, joint_evaluation)",
		},
		Parcours_apres_declaration_2: {
			type: ["string", "null"],
			description:
				"Parcours après la seconde déclaration (justify, corrective_action, joint_evaluation)",
		},
		Phase_2_requise: {
			type: "boolean",
			description:
				"Indique si la phase 2 (parcours après déclaration 1) est requise.",
		},
		Phase_2_revision_requise: {
			type: "boolean",
			description:
				"Indique si une révision du parcours phase 2 est requise après la seconde déclaration.",
		},
		Avis_CSE_requis: {
			type: "boolean",
			description: "Indique si un avis CSE est requis pour cette déclaration.",
		},
		Indicateur_G_requis: {
			type: "boolean",
			description:
				"Indique si l'indicateur G est requis (déclaration à 7 indicateurs).",
		},
		Version_regles: {
			type: ["string", "null"],
			description:
				"Version du moteur de règles métier utilisée à la soumission.",
		},
		Date_creation: { type: ["string", "null"], format: "date-time" },
		Date_modification: { type: ["string", "null"], format: "date-time" },
		Date_soumission: {
			type: ["string", "null"],
			format: "date-time",
			description: "Date de soumission initiale de la déclaration.",
		},
		Date_parcours_apres_declaration_1: {
			type: ["string", "null"],
			format: "date-time",
			description: "Date du choix du parcours après la première déclaration.",
		},
		Date_parcours_apres_declaration_2: {
			type: ["string", "null"],
			format: "date-time",
			description: "Date du choix du parcours après la seconde déclaration.",
		},
		Date_seconde_declaration: {
			type: ["string", "null"],
			format: "date-time",
			description: "Date de soumission de la seconde déclaration.",
		},
		Date_evaluation_conjointe: {
			type: ["string", "null"],
			format: "date-time",
			description: "Date de soumission du rapport d'évaluation conjointe.",
		},
		Date_avis_CSE: {
			type: ["string", "null"],
			format: "date-time",
			description: "Date de finalisation des avis CSE.",
		},
		Date_fin_demarche: {
			type: ["string", "null"],
			format: "date-time",
			description: "Date de finalisation complète de la démarche.",
		},
		Date_annulation: {
			type: ["string", "null"],
			format: "date-time",
			description:
				"Date d'annulation administrative de la déclaration. `null` si la déclaration est active. Une déclaration annulée conserve l'intégralité de ses données pour audit.",
			example: "2025-04-01T10:30:00.000Z",
		},
		Effectif_F_rem_annuelle_globale: {
			type: ["integer", "null"],
			description:
				"Effectif femmes pris en compte pour la rémunération globale annuelle",
		},
		Effectif_H_rem_annuelle_globale: {
			type: ["integer", "null"],
			description:
				"Effectif hommes pris en compte pour la rémunération globale annuelle",
		},
		Indicateurs: indicatorsSchema,
		Seconde_declaration: {
			type: "object",
			description:
				"Seconde déclaration (requise lorsque l'écart de rémunération atteint 5%)",
			properties: {
				Statut: {
					type: "boolean",
					description:
						"`true` si la seconde déclaration a été soumise, `false` sinon.",
				},
				Periode_reference_debut: { type: ["string", "null"], format: "date" },
				Periode_reference_fin: { type: ["string", "null"], format: "date" },
				Correction: {
					oneOf: [
						{ type: "array", items: indicatorGCategorySchema },
						{ type: "null" },
					],
					description: "Indicateur G corrigé. `null` si aucune correction.",
				},
			},
		},
		Declarant: declarantSchema,
		Avis_CSE: {
			type: "array",
			items: cseOpinionSchema,
			description:
				"Avis du CSE (PDF, jusqu'à 4/an, entreprises >= 100 salariés). Présent uniquement si au moins un fichier d'avis CSE a été déposé.",
		},
		Fichiers_CSE: {
			type: "array",
			items: {
				type: "object",
				properties: {
					Id: { type: "string", description: "Identifiant unique du fichier" },
					Type: {
						type: "string",
						enum: ["cse_opinion"],
						description: "Type : avis CSE",
					},
					Nom_fichier: {
						type: "string",
						description: "Nom d'origine du fichier déposé.",
						example: "avis-cse-2026.pdf",
					},
					Date_upload: { type: "string", format: "date-time" },
					URL_telechargement: {
						type: "string",
						description:
							"URL relative pour télécharger le fichier via GET /api/v1/files/{fileId}",
						example: "/api/v1/files/abc-123",
					},
				},
			},
			description:
				"Fichiers d'avis CSE attachés à la déclaration. Absent si aucun fichier n'a été déposé.",
		},
		Fichier_evaluation_conjointe: {
			oneOf: [
				{
					type: "object",
					properties: {
						Id: {
							type: "string",
							description: "Identifiant unique du fichier",
						},
						Type: {
							type: "string",
							enum: ["joint_evaluation"],
							description: "Type : évaluation conjointe",
						},
						Nom_fichier: {
							type: "string",
							description: "Nom d'origine du fichier déposé.",
							example: "evaluation-conjointe-2026.pdf",
						},
						Date_upload: { type: "string", format: "date-time" },
						URL_telechargement: {
							type: "string",
							description:
								"URL relative pour télécharger le fichier via GET /api/v1/files/{fileId}",
							example: "/api/v1/files/abc-123",
						},
					},
				},
				{ type: "null" },
			],
			description:
				"Fichier d'évaluation conjointe attaché à la déclaration (cardinalité 1). Absent si aucun fichier n'a été déposé.",
		},
	},
} as const;

const fileMetadataSchema = {
	type: "object",
	properties: {
		id: { type: "string", description: "File unique identifier" },
		type: {
			type: "string",
			enum: ["cse_opinion", "joint_evaluation"],
			description: "File type: CSE opinion or joint evaluation",
		},
		fileName: {
			type: "string",
			description: "Original file name as uploaded by the company.",
			example: "avis-cse-2026.pdf",
		},
		uploadedAt: { type: "string", format: "date-time" },
		downloadUrl: {
			type: "string",
			description:
				"Relative URL to download the file via GET /api/v1/files/{fileId}",
			example: "/api/v1/files/abc-123",
		},
	},
} as const;

const errorSchema = {
	type: "object",
	properties: {
		error: { type: "string" },
		details: {
			type: "array",
			items: {
				type: "object",
				properties: {
					path: { type: "array", items: { type: "string" } },
					message: { type: "string" },
				},
			},
		},
	},
} as const;

export const openApiSpec = {
	openapi: "3.1.0",
	info: {
		title: "EGAPRO — API d'export",
		description:
			"API REST sécurisée permettant de consulter les déclarations d'égalité professionnelle et les fichiers associés (avis CSE, évaluations conjointes). L'accès nécessite une clé API transmise en Bearer token. L'authentification ainsi qu'un quota (rate limit) sont appliqués en amont par la passerelle EGAPRO.",
		version: "2.0.0",
		contact: {
			name: "Équipe EGAPRO — DNUM",
		},
	},
	servers: [{ url: "/" }],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				description:
					"Clé API SUIT. Utiliser le header : Authorization: Bearer <clé>. La clé est validée par la passerelle (APISIX) en amont de l'application.",
			},
		},
	},
	security: [{ bearerAuth: [] }],
	paths: {
		"/api/v1/export/declarations": {
			get: {
				operationId: "getDeclarations",
				summary:
					"Lister les déclarations par date de soumission ou d'annulation",
				description:
					"Retourne les déclarations dont la date de mise à jour (`Date_modification`, pour les déclarations actives soumises) ou la date d'annulation (`Date_annulation`, pour les déclarations annulées) est comprise dans l'intervalle [`date_begin`, `date_end`[. Inclut les indicateurs A–G, la seconde déclaration, les avis CSE et le champ `Date_annulation` (renseigné si la déclaration est annulée). Les libellés des champs reprennent ceux du fichier GIP MDS.",
				parameters: [
					{
						name: "date_begin",
						in: "query",
						required: true,
						description: "Date de début (inclusive). Format YYYY-MM-DD.",
						example: "2026-03-01",
						schema: { type: "string", format: "date" },
					},
					{
						name: "date_end",
						in: "query",
						required: false,
						description:
							"Date de fin (exclusive). Format YYYY-MM-DD. Si omis, retourne uniquement le jour de `date_begin` (équivalent à `date_begin + 1 jour`).",
						example: "2026-03-24",
						schema: { type: "string", format: "date" },
					},
				],
				responses: {
					"200": {
						description:
							"Liste des déclarations correspondant à la plage de dates",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										Date_debut: {
											type: "string",
											format: "date",
											example: "2026-03-01",
										},
										Date_fin: {
											type: "string",
											format: "date",
											example: "2026-03-24",
										},
										Nombre: {
											type: "integer",
											description: "Nombre de déclarations retournées",
											example: 5,
										},
										Declarations: { type: "array", items: declarationSchema },
									},
								},
							},
						},
					},
					"401": {
						description:
							"Clé API manquante ou invalide (renvoyé par la passerelle)",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Clé API invalide",
										},
									},
								},
							},
						},
					},
					"429": {
						description:
							"Quota dépassé (rate limit appliqué par la passerelle)",
						content: { "application/json": { schema: errorSchema } },
					},
					"400": {
						description: "Paramètres invalides",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example:
												"Paramètres invalides. 'date_begin' est requis, format YYYY-MM-DD.",
										},
										details: {
											type: "array",
											description: "Zod validation issues",
											items: {
												type: "object",
												properties: {
													path: { type: "array", items: { type: "string" } },
													message: { type: "string" },
												},
											},
										},
									},
								},
							},
						},
					},
					"500": {
						description: "Erreur serveur",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example:
												"Erreur lors de la récupération des déclarations",
										},
									},
								},
							},
						},
					},
				},
			},
		},
		"/api/v1/files": {
			get: {
				operationId: "getFiles",
				summary: "Lister les fichiers CSE et évaluations conjointes",
				description:
					"Retourne les métadonnées des fichiers (avis CSE et évaluations conjointes) pour un SIREN et une année donnés.",
				parameters: [
					{
						name: "siren",
						in: "query",
						required: true,
						description: "SIREN de l'entreprise (9 chiffres)",
						example: "319159877",
						schema: { type: "string", pattern: "^\\d{9}$" },
					},
					{
						name: "year",
						in: "query",
						required: true,
						description: "Année de la déclaration (YYYY)",
						example: "2026",
						schema: { type: "string", pattern: "^\\d{4}$" },
					},
				],
				responses: {
					"200": {
						description: "Liste des fichiers",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										siren: { type: "string", example: "319159877" },
										year: { type: "integer", example: 2026 },
										files: { type: "array", items: fileMetadataSchema },
									},
								},
							},
						},
					},
					"401": {
						description:
							"Clé API manquante ou invalide (renvoyé par la passerelle)",
						content: { "application/json": { schema: errorSchema } },
					},
					"429": {
						description:
							"Quota dépassé (rate limit appliqué par la passerelle)",
						content: { "application/json": { schema: errorSchema } },
					},
					"400": {
						description: "Paramètres invalides",
						content: { "application/json": { schema: errorSchema } },
					},
					"500": {
						description: "Erreur serveur",
						content: { "application/json": { schema: errorSchema } },
					},
				},
			},
		},
		"/api/v1/files/{fileId}": {
			get: {
				operationId: "downloadFile",
				summary: "Télécharger un fichier",
				description:
					"Télécharge le fichier PDF (avis CSE ou évaluation conjointe) correspondant à l'identifiant.",
				parameters: [
					{
						name: "fileId",
						in: "path",
						required: true,
						description: "Identifiant unique du fichier",
						schema: { type: "string" },
					},
				],
				responses: {
					"200": {
						description: "Fichier PDF",
						content: {
							"application/pdf": {
								schema: { type: "string", format: "binary" },
							},
						},
					},
					"401": {
						description:
							"Clé API manquante ou invalide (renvoyé par la passerelle)",
						content: { "application/json": { schema: errorSchema } },
					},
					"429": {
						description:
							"Quota dépassé (rate limit appliqué par la passerelle)",
						content: { "application/json": { schema: errorSchema } },
					},
					"404": {
						description: "Fichier non trouvé",
						content: { "application/json": { schema: errorSchema } },
					},
					"500": {
						description: "Erreur serveur",
						content: { "application/json": { schema: errorSchema } },
					},
				},
			},
		},
	},
} as const;

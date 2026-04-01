// OpenAPI 3.1 specification for the declarations export API.

const declarantSchema = {
	type: "object",
	properties: {
		firstName: { type: ["string", "null"] },
		lastName: { type: ["string", "null"] },
		email: { type: ["string", "null"] },
		phone: { type: ["string", "null"] },
	},
} as const;

const indicatorGCategorySchema = {
	type: "object",
	properties: {
		categoryName: {
			type: "string",
			description: "CSP category (e.g. 'Ouvriers', 'Ingénieurs et cadres')",
		},
		detail: { type: ["string", "null"], description: "Category description" },
		womenCount: { type: ["integer", "null"] },
		menCount: { type: ["integer", "null"] },
		annualBaseWomen: { type: ["string", "null"] },
		annualBaseMen: { type: ["string", "null"] },
		annualVariableWomen: { type: ["string", "null"] },
		annualVariableMen: { type: ["string", "null"] },
		hourlyBaseWomen: { type: ["string", "null"] },
		hourlyBaseMen: { type: ["string", "null"] },
		hourlyVariableWomen: { type: ["string", "null"] },
		hourlyVariableMen: { type: ["string", "null"] },
	},
} as const;

const cseOpinionSchema = {
	type: "object",
	properties: {
		type: { type: "string" },
		opinion: { type: ["string", "null"] },
		date: { type: ["string", "null"], format: "date" },
	},
} as const;

const indicatorFQuartileSchema = {
	type: "object",
	description: "Quartile breakdown with salary threshold and headcounts",
	properties: {
		threshold: {
			type: ["string", "null"],
			description: "Upper salary threshold for this quartile (numeric string)",
		},
		women: { type: ["integer", "null"], description: "Women headcount" },
		men: { type: ["integer", "null"], description: "Men headcount" },
	},
} as const;

const indicatorFSchema = {
	type: "object",
	description:
		"Pay quartile distribution. Each array has 4 entries (Q1–Q4). Null values indicate the indicator was not provided.",
	properties: {
		annual: {
			type: "array",
			items: indicatorFQuartileSchema,
			description: "Annual salary quartile distribution (Q1 to Q4)",
		},
		hourly: {
			type: "array",
			items: indicatorFQuartileSchema,
			description: "Hourly salary quartile distribution (Q1 to Q4)",
		},
	},
} as const;

const indicatorPayGapSchema = {
	type: "object",
	description: "Pay gap values split by pay period (annual / hourly)",
	properties: {
		annualWomen: {
			type: ["string", "null"],
			description: "Annual pay — women (numeric string)",
		},
		annualMen: {
			type: ["string", "null"],
			description: "Annual pay — men (numeric string)",
		},
		hourlyWomen: {
			type: ["string", "null"],
			description: "Hourly pay — women (numeric string)",
		},
		hourlyMen: {
			type: ["string", "null"],
			description: "Hourly pay — men (numeric string)",
		},
	},
} as const;

const indicatorsSchema = {
	type: "object",
	description:
		"Pre-calculated indicators A–F (from GIP-MDS DSN data) and company-declared indicator G",
	properties: {
		A: {
			...indicatorPayGapSchema,
			description: "Mean gross pay gap (annual + hourly)",
		},
		B: {
			...indicatorPayGapSchema,
			description: "Mean gross variable pay gap (annual + hourly)",
		},
		C: {
			...indicatorPayGapSchema,
			description: "Median gross pay gap (annual + hourly)",
		},
		D: {
			...indicatorPayGapSchema,
			description: "Median gross variable pay gap (annual + hourly)",
		},
		E: {
			type: "object",
			description: "Variable pay beneficiary count",
			properties: {
				women: {
					type: ["string", "null"],
					description: "Women beneficiary count (numeric string)",
				},
				men: {
					type: ["string", "null"],
					description: "Men beneficiary count (numeric string)",
				},
			},
		},
		F: indicatorFSchema,
		G: {
			oneOf: [
				{ type: "array", items: indicatorGCategorySchema },
				{ type: "null" },
			],
			description:
				"Company-declared pay gap by CSP (base + variable, annual + hourly). Null if not declared.",
		},
	},
} as const;

const declarationSchema = {
	type: "object",
	properties: {
		siren: {
			type: "string",
			description: "Company SIREN (9 digits)",
			example: "319159877",
		},
		companyName: { type: ["string", "null"], example: "THALES LAS FRANCE SAS" },
		workforce: {
			type: ["integer", "null"],
			description: "Total workforce",
			example: 7403,
		},
		nafCode: {
			type: ["string", "null"],
			description: "NAF/APE code",
			example: "26.51A",
		},
		address: {
			type: ["string", "null"],
			example: "2 AVENUE GAY-LUSSAC, 78990 ELANCOURT",
		},
		hasCse: {
			type: ["boolean", "null"],
			description: "Whether the company has a CSE (>= 50 employees)",
		},
		year: { type: "integer", description: "Declaration year", example: 2026 },
		status: {
			type: "string",
			description: "Declaration status",
			example: "submitted",
		},
		compliancePath: {
			type: ["string", "null"],
			description: "Compliance path chosen by the company",
		},
		createdAt: { type: ["string", "null"], format: "date-time" },
		updatedAt: { type: ["string", "null"], format: "date-time" },
		totalWomen: {
			type: ["integer", "null"],
			description: "Total women in workforce",
		},
		totalMen: {
			type: ["integer", "null"],
			description: "Total men in workforce",
		},
		indicators: indicatorsSchema,
		secondDeclaration: {
			type: "object",
			description: "Second declaration (required when pay gap >= 5%)",
			properties: {
				status: { type: ["string", "null"] },
				referencePeriodStart: { type: ["string", "null"], format: "date" },
				referencePeriodEnd: { type: ["string", "null"], format: "date" },
				correction: {
					oneOf: [
						{ type: "array", items: indicatorGCategorySchema },
						{ type: "null" },
					],
					description:
						"Corrected indicator G categories. Null if no correction.",
				},
			},
		},
		declarant: declarantSchema,
		cseOpinions: {
			type: "array",
			items: cseOpinionSchema,
			description:
				"CSE opinions (PDF uploads, up to 4/year, companies >= 100 employees)",
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
		fileName: { type: "string", example: "avis-cse-2026.pdf" },
		uploadedAt: { type: "string", format: "date-time" },
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
			"API REST sécurisée permettant de consulter les déclarations d'égalité professionnelle et les fichiers associés (avis CSE, évaluations conjointes). L'accès nécessite une clé API (Bearer token).",
		version: "1.1.0",
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
					"Clé API SUIT. Utiliser le header : Authorization: Bearer <clé>",
			},
		},
	},
	security: [{ bearerAuth: [] }],
	paths: {
		"/api/v1/export/declarations": {
			get: {
				operationId: "getDeclarations",
				summary: "Lister les déclarations par date de soumission",
				description:
					"Retourne les déclarations soumises dont la date de mise à jour (`updatedAt`) est comprise dans l'intervalle [`date_begin`, `date_end`[. Inclut les indicateurs A–G, la seconde déclaration et les avis CSE.",
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
										dateBegin: {
											type: "string",
											format: "date",
											example: "2026-03-01",
										},
										dateEnd: {
											type: "string",
											format: "date",
											example: "2026-03-24",
										},
										count: {
											type: "integer",
											description: "Number of declarations returned",
											example: 5,
										},
										declarations: { type: "array", items: declarationSchema },
									},
								},
							},
						},
					},
					"401": {
						description: "Clé API manquante ou invalide",
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
						description: "Clé API manquante ou invalide",
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
						description: "Clé API manquante ou invalide",
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

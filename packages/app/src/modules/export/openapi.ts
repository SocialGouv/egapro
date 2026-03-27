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

const payValueSchema = {
	type: "object",
	properties: {
		category: {
			type: "string",
			description: "Category label (e.g. 'Annuelle brute moyenne')",
		},
		womenValue: { type: ["string", "null"] },
		menValue: { type: ["string", "null"] },
	},
} as const;

const quartileSchema = {
	type: "object",
	properties: {
		category: {
			type: "string",
			description: "Quartile label (e.g. 'annual:1er quartile')",
		},
		womenCount: { type: ["integer", "null"] },
		menCount: { type: ["integer", "null"] },
		womenValue: { type: ["string", "null"] },
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

const indicatorsSchema = {
	type: "object",
	description:
		"Pre-calculated indicators A–F (from GIP-MDS DSN data) and company-declared indicator G",
	properties: {
		A: {
			type: "array",
			items: payValueSchema,
			description: "Mean gross pay gap (annual + hourly)",
		},
		B: {
			type: "array",
			items: payValueSchema,
			description: "Mean gross bonus gap (annual + hourly)",
		},
		C: {
			type: "array",
			items: payValueSchema,
			description: "Median gross pay gap (annual + hourly)",
		},
		D: {
			type: "array",
			items: payValueSchema,
			description: "Median gross bonus gap (annual + hourly)",
		},
		E: {
			type: "array",
			items: payValueSchema,
			description: "Beneficiaries count",
		},
		F: {
			type: "array",
			items: quartileSchema,
			description: "Pay distribution by quartile (annual + hourly)",
		},
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
			"API REST publique permettant de consulter les déclarations d'égalité professionnelle et les fichiers associés (avis CSE, évaluations conjointes).",
		version: "1.1.0",
		contact: {
			name: "Équipe EGAPRO — DNUM",
		},
	},
	servers: [{ url: "/" }],
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

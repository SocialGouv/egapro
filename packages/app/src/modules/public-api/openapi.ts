const publicDeclarationSchema = {
	type: "object",
	description:
		"Déclaration d'index égalité professionnelle. Ce schéma expose uniquement des **données brutes** (écarts, proportions, quartiles, effectifs) calculées par le GIP-MDS à partir des DSN. Aucun score ni indice /100 n'est exposé. L'indicateur G (écart déclaré par l'entreprise par catégorie socio-professionnelle) est exclu. Pour les entreprises non diffusibles (`statutDiffusion === 'N'`), les champs d'identité (`name`, `address`, `region`, `departmentCode`, `departmentLabel`, `nafCode`, `nafLabel`) sont `null`.",
	required: ["year", "siren"],
	properties: {
		year: {
			type: "integer",
			description: "Année de référence de la déclaration.",
			example: 2026,
		},
		siren: {
			type: "string",
			description: "SIREN de l'entreprise (9 chiffres).",
			example: "319159877",
		},
		name: {
			type: ["string", "null"],
			description:
				"Raison sociale. `null` pour les entreprises non diffusibles.",
			example: "THALES LAS FRANCE SAS",
		},
		address: {
			type: ["string", "null"],
			description: "Adresse. `null` pour les entreprises non diffusibles.",
			example: "2 AVENUE GAY-LUSSAC, 78990 ELANCOURT",
		},
		region: {
			type: ["string", "null"],
			description: "Région. `null` pour les entreprises non diffusibles.",
			example: "Île-de-France",
		},
		departmentCode: {
			type: ["string", "null"],
			description:
				"Code département. `null` pour les entreprises non diffusibles.",
			example: "78",
		},
		departmentLabel: {
			type: ["string", "null"],
			description:
				"Libellé département. `null` pour les entreprises non diffusibles.",
			example: "Yvelines",
		},
		nafCode: {
			type: ["string", "null"],
			description: "Code NAF/APE. `null` pour les entreprises non diffusibles.",
			example: "26.51A",
		},
		nafLabel: {
			type: ["string", "null"],
			description:
				"Libellé NAF/APE. `null` pour les entreprises non diffusibles.",
			example: "Fabrication d'instruments de navigation",
		},
		workforceEma: {
			type: ["number", "null"],
			description:
				"Effectif moyen annuel (EMA) issu des données GIP-MDS. `null` si non disponible.",
			example: 7403,
		},
		totalWomen: {
			type: ["integer", "null"],
			description:
				"Nombre de femmes prises en compte dans le calcul de la rémunération globale annuelle.",
			example: 2400,
		},
		totalMen: {
			type: ["integer", "null"],
			description:
				"Nombre d'hommes pris en compte dans le calcul de la rémunération globale annuelle.",
			example: 5003,
		},
		globalAnnualMeanGap: {
			type: ["number", "null"],
			description:
				"Écart moyen de rémunération globale annuelle (F/H). Exprimé en pourcentage (ex. `-12.5` = les femmes gagnent 12,5 % de moins en moyenne). `null` si non disponible.",
			example: -12.5,
		},
		globalAnnualMedianGap: {
			type: ["number", "null"],
			description:
				"Écart médian de rémunération globale annuelle (F/H). `null` si non disponible.",
			example: -10.2,
		},
		globalHourlyMeanGap: {
			type: ["number", "null"],
			description:
				"Écart moyen de taux horaire global (F/H). `null` si non disponible.",
			example: -8.1,
		},
		globalHourlyMedianGap: {
			type: ["number", "null"],
			description:
				"Écart médian de taux horaire global (F/H). `null` si non disponible.",
			example: -7.3,
		},
		variableAnnualMeanGap: {
			type: ["number", "null"],
			description:
				"Écart moyen de rémunération variable annuelle (F/H). `null` si non disponible.",
			example: -18.4,
		},
		variableAnnualMedianGap: {
			type: ["number", "null"],
			description:
				"Écart médian de rémunération variable annuelle (F/H). `null` si non disponible.",
			example: -15.0,
		},
		variableHourlyMeanGap: {
			type: ["number", "null"],
			description:
				"Écart moyen de taux horaire variable (F/H). `null` si non disponible.",
			example: -11.2,
		},
		variableHourlyMedianGap: {
			type: ["number", "null"],
			description:
				"Écart médian de taux horaire variable (F/H). `null` si non disponible.",
			example: -9.8,
		},
		variableProportionWomen: {
			type: ["number", "null"],
			description:
				"Proportion de femmes bénéficiaires d'une rémunération variable (entre 0 et 1). `null` si non disponible.",
			example: 0.32,
		},
		variableProportionMen: {
			type: ["number", "null"],
			description:
				"Proportion d'hommes bénéficiaires d'une rémunération variable (entre 0 et 1). `null` si non disponible.",
			example: 0.68,
		},
		annualQuartile1ProportionWomen: {
			type: ["number", "null"],
			description:
				"Proportion de femmes dans le 1er quartile de rémunération globale annuelle (entre 0 et 1). `null` si non disponible.",
			example: 0.25,
		},
		annualQuartile2ProportionWomen: {
			type: ["number", "null"],
			description:
				"Proportion de femmes dans le 2e quartile de rémunération globale annuelle. `null` si non disponible.",
			example: 0.3,
		},
		annualQuartile3ProportionWomen: {
			type: ["number", "null"],
			description:
				"Proportion de femmes dans le 3e quartile de rémunération globale annuelle. `null` si non disponible.",
			example: 0.28,
		},
		annualQuartile4ProportionWomen: {
			type: ["number", "null"],
			description:
				"Proportion de femmes dans le 4e quartile de rémunération globale annuelle. `null` si non disponible.",
			example: 0.22,
		},
		annualQuartile1ProportionMen: {
			type: ["number", "null"],
			description:
				"Proportion d'hommes dans le 1er quartile de rémunération globale annuelle. `null` si non disponible.",
			example: 0.75,
		},
		annualQuartile2ProportionMen: {
			type: ["number", "null"],
			description:
				"Proportion d'hommes dans le 2e quartile de rémunération globale annuelle. `null` si non disponible.",
			example: 0.7,
		},
		annualQuartile3ProportionMen: {
			type: ["number", "null"],
			description:
				"Proportion d'hommes dans le 3e quartile de rémunération globale annuelle. `null` si non disponible.",
			example: 0.72,
		},
		annualQuartile4ProportionMen: {
			type: ["number", "null"],
			description:
				"Proportion d'hommes dans le 4e quartile de rémunération globale annuelle. `null` si non disponible.",
			example: 0.78,
		},
		hourlyQuartile1ProportionWomen: {
			type: ["number", "null"],
			description:
				"Proportion de femmes dans le 1er quartile de taux horaire global. `null` si non disponible.",
			example: 0.26,
		},
		hourlyQuartile2ProportionWomen: {
			type: ["number", "null"],
			description:
				"Proportion de femmes dans le 2e quartile de taux horaire global. `null` si non disponible.",
			example: 0.31,
		},
		hourlyQuartile3ProportionWomen: {
			type: ["number", "null"],
			description:
				"Proportion de femmes dans le 3e quartile de taux horaire global. `null` si non disponible.",
			example: 0.29,
		},
		hourlyQuartile4ProportionWomen: {
			type: ["number", "null"],
			description:
				"Proportion de femmes dans le 4e quartile de taux horaire global. `null` si non disponible.",
			example: 0.21,
		},
		hourlyQuartile1ProportionMen: {
			type: ["number", "null"],
			description:
				"Proportion d'hommes dans le 1er quartile de taux horaire global. `null` si non disponible.",
			example: 0.74,
		},
		hourlyQuartile2ProportionMen: {
			type: ["number", "null"],
			description:
				"Proportion d'hommes dans le 2e quartile de taux horaire global. `null` si non disponible.",
			example: 0.69,
		},
		hourlyQuartile3ProportionMen: {
			type: ["number", "null"],
			description:
				"Proportion d'hommes dans le 3e quartile de taux horaire global. `null` si non disponible.",
			example: 0.71,
		},
		hourlyQuartile4ProportionMen: {
			type: ["number", "null"],
			description:
				"Proportion d'hommes dans le 4e quartile de taux horaire global. `null` si non disponible.",
			example: 0.79,
		},
	},
} as const;

const publicSearchResultSchema = {
	type: "object",
	required: ["data", "count"],
	properties: {
		data: {
			type: "array",
			items: publicDeclarationSchema,
			description: "Liste des déclarations correspondant à la recherche.",
		},
		count: {
			type: "integer",
			description: "Nombre total de résultats (avant pagination).",
			example: 42,
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

const sirenParam = {
	name: "siren",
	in: "path",
	required: true,
	description: "SIREN de l'entreprise (9 chiffres).",
	example: "319159877",
	schema: { type: "string", pattern: "^\\d{9}$" },
} as const;

export const publicOpenApiSpec = {
	openapi: "3.1.0",
	info: {
		title: "EGAPRO — API publique",
		description: `API publique de consultation des déclarations d'index égalité professionnelle.

**Modèle de données brutes** : cette API expose uniquement les données brutes calculées par le GIP-MDS à partir des DSN (écarts de rémunération, proportions, répartitions par quartile, effectifs). Aucun score ni indice global /100 n'est exposé.

**Indicateur G exclu** : l'indicateur G (écart de rémunération déclaré par l'entreprise par catégorie socio-professionnelle) n'est pas exposé par cette API.

**Identité des entreprises non diffusibles masquée** : pour les entreprises dont le statut de diffusion est non diffusible (\`statutDiffusion === 'N'\`), les champs d'identité (\`name\`, \`address\`, \`region\`, \`departmentCode\`, \`departmentLabel\`, \`nafCode\`, \`nafLabel\`) sont retournés à \`null\`. Le SIREN, l'effectif EMA et les indicateurs A–F restent disponibles.

**Gate par date de rendu public** : seules les déclarations dont l'année correspond à une campagne dont la date de rendu public est atteinte sont servies. Les données d'une campagne en cours ou dont la date de publication n'est pas encore passée ne sont pas exposées.`,
		version: "1.0.0",
		contact: {
			name: "Équipe EGAPRO — DNUM",
		},
		license: {
			name: "Etalab 2.0",
			url: "https://www.etalab.gouv.fr/licence-ouverte-open-licence",
		},
	},
	servers: [{ url: "/" }],
	components: {
		schemas: {
			PublicDeclaration: publicDeclarationSchema,
			PublicSearchResult: publicSearchResultSchema,
			Error: errorSchema,
		},
	},
	paths: {
		"/api/public/declarations": {
			get: {
				operationId: "searchPublicDeclarations",
				summary: "Rechercher des déclarations",
				description:
					"Recherche paginée sur les déclarations publiées. Les résultats sont filtrables par texte libre, région, département, code NAF et année. Seules les années dont la date de rendu public est atteinte sont incluses.",
				parameters: [
					{
						name: "q",
						in: "query",
						required: false,
						description:
							"Texte libre (raison sociale, SIREN). Ignoré si la chaîne est vide.",
						example: "THALES",
						schema: { type: "string" },
					},
					{
						name: "region",
						in: "query",
						required: false,
						description:
							"Filtre par code de région (ex. `11` pour Île-de-France).",
						example: "11",
						schema: { type: "string" },
					},
					{
						name: "departement",
						in: "query",
						required: false,
						description: "Filtre par code département (ex. `75` pour Paris).",
						example: "75",
						schema: { type: "string" },
					},
					{
						name: "naf",
						in: "query",
						required: false,
						description: "Filtre par code NAF (ex. `26.51A`).",
						example: "26.51A",
						schema: { type: "string" },
					},
					{
						name: "year",
						in: "query",
						required: false,
						description:
							"Filtre par année de déclaration. Doit être une année dont la date de rendu public est atteinte.",
						example: 2026,
						schema: { type: "integer" },
					},
					{
						name: "limit",
						in: "query",
						required: false,
						description:
							"Nombre de résultats par page. Entre 1 et 100. Défaut : 10.",
						example: 10,
						schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
					},
					{
						name: "offset",
						in: "query",
						required: false,
						description: "Décalage de pagination. Défaut : 0.",
						example: 0,
						schema: { type: "integer", minimum: 0, default: 0 },
					},
				],
				responses: {
					"200": {
						description: "Liste paginée de déclarations.",
						headers: {
							"Access-Control-Allow-Origin": {
								schema: { type: "string" },
								description:
									"Toujours `*` — accessible depuis n'importe quelle origine.",
							},
						},
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/PublicSearchResult" },
							},
						},
					},
					"400": {
						description: "Paramètres invalides.",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"500": {
						description: "Erreur serveur.",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/public/declarations/{siren}": {
			get: {
				operationId: "getPublicDeclarationsBySiren",
				summary: "Lister les déclarations d'une entreprise",
				description:
					"Retourne toutes les déclarations publiées pour le SIREN donné, triées par année décroissante. Seules les années dont la date de rendu public est atteinte sont retournées.",
				parameters: [
					sirenParam,
					{
						name: "limit",
						in: "query",
						required: false,
						description: "Nombre maximal de résultats. Entre 1 et 100.",
						example: 10,
						schema: { type: "integer", minimum: 1, maximum: 100 },
					},
				],
				responses: {
					"200": {
						description: "Liste des déclarations publiées pour ce SIREN.",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/PublicDeclaration" },
								},
							},
						},
					},
					"400": {
						description: "SIREN invalide.",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"500": {
						description: "Erreur serveur.",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/public/declarations/{siren}/{year}": {
			get: {
				operationId: "getPublicDeclarationBySirenYear",
				summary: "Consulter une déclaration par SIREN et année",
				description:
					"Retourne la déclaration publiée pour le SIREN et l'année donnés. Retourne 404 si la déclaration n'existe pas ou si la date de rendu public de cette année n'est pas encore atteinte.",
				parameters: [
					sirenParam,
					{
						name: "year",
						in: "path",
						required: true,
						description: "Année de la déclaration (YYYY).",
						example: 2026,
						schema: { type: "integer", minimum: 2018 },
					},
				],
				responses: {
					"200": {
						description: "Déclaration publiée.",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/PublicDeclaration" },
							},
						},
					},
					"400": {
						description: "SIREN ou année invalide.",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"404": {
						description:
							"Déclaration non trouvée ou non encore publiée (date de rendu public non atteinte).",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"500": {
						description: "Erreur serveur.",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/api/public/declarations/export": {
			get: {
				operationId: "exportPublicDeclarations",
				summary: "Exporter toutes les déclarations publiées",
				description:
					"Retourne l'intégralité des déclarations publiées (toutes les années dont la date de rendu public est atteinte) en JSON ou CSV. Le volume peut être important (plusieurs milliers de lignes). L'export est mis en cache 1 heure côté serveur.",
				parameters: [
					{
						name: "format",
						in: "query",
						required: false,
						description:
							"Format de sortie : `json` (défaut) ou `csv`. Le CSV utilise `;` comme séparateur.",
						example: "json",
						schema: { type: "string", enum: ["json", "csv"], default: "json" },
					},
				],
				responses: {
					"200": {
						description:
							"Export complet des déclarations publiées. Le `Content-Type` dépend du format demandé.",
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["data", "count"],
									properties: {
										data: {
											type: "array",
											items: { $ref: "#/components/schemas/PublicDeclaration" },
										},
										count: { type: "integer", example: 12000 },
									},
								},
							},
							"text/csv": {
								schema: {
									type: "string",
									description:
										"Fichier CSV avec en-tête, séparateur `;`. Colonnes dans l'ordre de `PublicDeclaration`.",
								},
							},
						},
					},
					"400": {
						description: "Paramètre `format` invalide.",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
					"500": {
						description: "Erreur serveur.",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
	},
} as const;

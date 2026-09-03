import {
	buildSearchParameters,
	corsAllowOriginHeader,
	errorResponse,
	limitOnlyParam,
	publicNonDiffusibleIdentityProperties,
	serverErrorResponse,
	sirenParam,
} from "./openapiShared";

export const publicDeclarationSchema = {
	type: "object",
	description:
		"Déclaration d'index égalité professionnelle. Ce schéma expose uniquement des **données brutes** (écarts, proportions, quartiles, effectifs) calculées par le GIP-MDS à partir des DSN. Aucun score ni indice /100 n'est exposé. L'indicateur G (écart déclaré par l'entreprise par catégorie socio-professionnelle) est exclu. Pour les entreprises non diffusibles (`statutDiffusion === 'N'`), tous les champs d'identité, de localisation et d'activité valent `Non-diffusible`; le SIREN, l'effectif EMA et les indicateurs restent disponibles.",
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
		...publicNonDiffusibleIdentityProperties,
		city: {
			type: ["string", "null"],
			description:
				"Ville du siège. Vaut `Non-diffusible` lorsque l'entreprise n'est pas diffusible.",
			example: "Élancourt",
		},
		regionCode: {
			type: ["string", "null"],
			description:
				"Code de région française, si applicable. Vaut `Non-diffusible` lorsque l'entreprise n'est pas diffusible.",
			example: "11",
		},
		countryCode: {
			type: ["string", "null"],
			description:
				"Code du pays pour une entreprise établie à l'étranger. Vaut `Non-diffusible` lorsque l'entreprise n'est pas diffusible.",
			example: "99100",
		},
		countryLabel: {
			type: ["string", "null"],
			description:
				"Pays affiché à la place de la région et du département. Vaut `Non-diffusible` lorsque l'entreprise n'est pas diffusible.",
			example: "Belgique",
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
		hourlyWomen: {
			type: ["integer", "null"],
			description:
				"Nombre de femmes prises en compte dans le calcul de la rémunération globale horaire.",
			example: 2380,
		},
		hourlyMen: {
			type: ["integer", "null"],
			description:
				"Nombre d'hommes pris en compte dans le calcul de la rémunération globale horaire.",
			example: 4960,
		},
		globalAnnualMeanGap: {
			type: ["number", "null"],
			description:
				"Écart moyen de rémunération globale annuelle (F/H). Ratio entre −1 et 1 : une valeur positive signifie que les hommes gagnent davantage, une valeur négative que les femmes gagnent davantage. Multiplier par 100 pour obtenir un pourcentage. `null` si non disponible.",
			example: -0.125,
		},
		globalAnnualMedianGap: {
			type: ["number", "null"],
			description:
				"Écart médian de rémunération globale annuelle (F/H). Ratio entre −1 et 1 (même convention que `globalAnnualMeanGap`). Multiplier par 100 pour obtenir un pourcentage. `null` si non disponible.",
			example: -0.102,
		},
		globalHourlyMeanGap: {
			type: ["number", "null"],
			description:
				"Écart moyen de taux horaire global (F/H). Ratio entre −1 et 1 (même convention que `globalAnnualMeanGap`). Multiplier par 100 pour obtenir un pourcentage. `null` si non disponible.",
			example: -0.081,
		},
		globalHourlyMedianGap: {
			type: ["number", "null"],
			description:
				"Écart médian de taux horaire global (F/H). Ratio entre −1 et 1 (même convention que `globalAnnualMeanGap`). Multiplier par 100 pour obtenir un pourcentage. `null` si non disponible.",
			example: -0.073,
		},
		variableAnnualMeanGap: {
			type: ["number", "null"],
			description:
				"Écart moyen de rémunération variable annuelle (F/H). Ratio entre −1 et 1 (même convention que `globalAnnualMeanGap`). Multiplier par 100 pour obtenir un pourcentage. `null` si non disponible.",
			example: -0.184,
		},
		variableAnnualMedianGap: {
			type: ["number", "null"],
			description:
				"Écart médian de rémunération variable annuelle (F/H). Ratio entre −1 et 1 (même convention que `globalAnnualMeanGap`). Multiplier par 100 pour obtenir un pourcentage. `null` si non disponible.",
			example: -0.15,
		},
		variableHourlyMeanGap: {
			type: ["number", "null"],
			description:
				"Écart moyen de taux horaire variable (F/H). Ratio entre −1 et 1 (même convention que `globalAnnualMeanGap`). Multiplier par 100 pour obtenir un pourcentage. `null` si non disponible.",
			example: -0.112,
		},
		variableHourlyMedianGap: {
			type: ["number", "null"],
			description:
				"Écart médian de taux horaire variable (F/H). Ratio entre −1 et 1 (même convention que `globalAnnualMeanGap`). Multiplier par 100 pour obtenir un pourcentage. `null` si non disponible.",
			example: -0.098,
		},
		variableProportionWomen: {
			type: ["number", "null"],
			description:
				"Part des femmes de l'effectif qui bénéficient d'une rémunération variable, soit `bénéficiaires femmes / totalWomen` (entre 0 et 1). Indépendante de `variableProportionMen` : les deux ne somment pas à 1. `null` si non disponible.",
			example: 0.5625,
		},
		variableProportionMen: {
			type: ["number", "null"],
			description:
				"Part des hommes de l'effectif qui bénéficient d'une rémunération variable, soit `bénéficiaires hommes / totalMen` (entre 0 et 1). Indépendante de `variableProportionWomen` : les deux ne somment pas à 1. `null` si non disponible.",
			example: 0.6,
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

export const publicSearchResultSchema = {
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

const declarationSearchExtras = [
	{
		name: "city",
		in: "query",
		required: false,
		description: "Filtre par ville (recherche partielle).",
		schema: { type: "string" },
	},
	{
		name: "workforceMin",
		in: "query",
		required: false,
		description: "Effectif EMA minimum.",
		schema: { type: "integer", minimum: 0 },
	},
	{
		name: "workforceMax",
		in: "query",
		required: false,
		description: "Effectif EMA maximum.",
		schema: { type: "integer", minimum: 0 },
	},
	{
		name: "workforceRanges",
		in: "query",
		required: false,
		description:
			"Filtre par tranche d'effectif de l'observatoire. Répétable : plusieurs tranches sont combinées en « ou ».",
		explode: true,
		style: "form",
		schema: {
			type: "array",
			items: {
				type: "string",
				enum: ["<50", "50-99", "100-249", "250-999", "1000+"],
			},
		},
	},
	{
		name: "sort",
		in: "query",
		required: false,
		description: "Tri par pertinence, raison sociale ou année décroissante.",
		schema: {
			type: "string",
			enum: ["relevance", "name", "year"],
			default: "relevance",
		},
	},
] as const;

function declarationSearchParameters() {
	return [
		...buildSearchParameters({
			description:
				"Filtre par année de déclaration. Doit être une année dont la date de rendu public est atteinte.",
			example: 2026,
		}),
		...declarationSearchExtras,
	];
}

function declarationExportFilterParameters() {
	return declarationSearchParameters().filter(
		(parameter) =>
			parameter.name !== "limit" &&
			parameter.name !== "offset" &&
			parameter.name !== "sort",
	);
}

export const declarationsPaths = {
	"/api/public/declarations": {
		get: {
			operationId: "searchPublicDeclarations",
			summary: "Rechercher des déclarations",
			description:
				"Recherche paginée sur les entreprises ayant une déclaration publiée. Sans filtre d'année, une seule ligne — la plus récente — est retournée par SIREN. Les résultats sont filtrables par texte libre, ville, région, département, section NAF, effectif et année.",
			parameters: declarationSearchParameters(),
			responses: {
				"200": {
					description: "Liste paginée de déclarations.",
					headers: {
						"Access-Control-Allow-Origin": corsAllowOriginHeader,
					},
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/PublicSearchResult" },
						},
					},
				},
				"400": errorResponse("Paramètres invalides."),
				"500": serverErrorResponse,
			},
		},
	},
	"/api/public/declarations/{siren}": {
		get: {
			operationId: "getPublicDeclarationsBySiren",
			summary: "Lister les déclarations d'une entreprise",
			description:
				"Retourne toutes les déclarations publiées pour le SIREN donné, triées par année décroissante. Seules les années dont la date de rendu public est atteinte sont retournées.",
			parameters: [sirenParam, limitOnlyParam],
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
				"400": errorResponse("SIREN invalide."),
				"500": serverErrorResponse,
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
				"400": errorResponse("SIREN ou année invalide."),
				"404": errorResponse(
					"Déclaration non trouvée ou non encore publiée (date de rendu public non atteinte).",
				),
				"500": serverErrorResponse,
			},
		},
	},
	"/api/public/declarations/export": {
		get: {
			operationId: "exportPublicDeclarations",
			summary: "Exporter toutes les déclarations publiées",
			description:
				"Retourne les déclarations publiées (toutes les années dont la date de rendu public est atteinte) en JSON, CSV ou Excel. Les filtres de la recherche peuvent être repris. L'export est mis en cache 1 heure côté serveur.",
			parameters: [
				{
					name: "format",
					in: "query",
					required: false,
					description:
						"Format de sortie : `json` (défaut), `csv` ou `xlsx`. Le CSV utilise `;` comme séparateur.",
					example: "json",
					schema: {
						type: "string",
						enum: ["json", "csv", "xlsx"],
						default: "json",
					},
				},
				...declarationExportFilterParameters(),
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
						"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
							{
								schema: { type: "string", format: "binary" },
							},
					},
				},
				"400": errorResponse("Paramètre `format` invalide."),
				"413": errorResponse(
					"Export Excel trop volumineux : ajoutez des filtres ou utilisez le format CSV.",
				),
				"500": serverErrorResponse,
			},
		},
	},
} as const;

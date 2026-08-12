import {
	buildSearchParameters,
	corsAllowOriginHeader,
	invalidParamsResponse,
	limitOnlyParam,
	notFoundResponse,
	publicNonDiffusibleIdentityProperties,
	serverErrorResponse,
	sirenParam,
} from "./openapiShared";

export const publicRepresentationSchema = {
	type: "object",
	description:
		"Écarts de représentation équilibrée femmes-hommes parmi les cadres dirigeants et les instances dirigeantes (art. D. 1142-19). Ce schéma expose uniquement des **données brutes** déclarées par l'entreprise. Aucun verdict de conformité ni score n'est exposé. Pour les entreprises non diffusibles (`statutDiffusion === 'N'`), les champs d'identité (`name`, `address`, `region`, `departmentCode`, `departmentLabel`, `nafCode`, `nafLabel`) sont `null`.",
	required: ["siren", "year"],
	properties: {
		siren: {
			type: "string",
			description: "SIREN de l'entreprise (9 chiffres).",
			example: "319159877",
		},
		year: {
			type: "integer",
			description: "Année de référence de la déclaration.",
			example: 2026,
		},
		...publicNonDiffusibleIdentityProperties,
		referencePeriodStart: {
			type: ["string", "null"],
			description:
				"Date de début de la période de référence (YYYY-MM-DD). `null` si non renseignée.",
			example: "2025-01-01",
		},
		referencePeriodEnd: {
			type: ["string", "null"],
			description:
				"Date de fin de la période de référence (YYYY-MM-DD). `null` si non renseignée.",
			example: "2025-12-31",
		},
		executiveWomenPercent: {
			type: ["number", "null"],
			description:
				"Part de femmes parmi les cadres dirigeants, en pourcentage (entre 0 et 100). `null` si non calculable — voir `notComputableReasonExecutives`.",
			example: 35.5,
		},
		executiveMenPercent: {
			type: ["number", "null"],
			description:
				"Part d'hommes parmi les cadres dirigeants, en pourcentage (entre 0 et 100). `null` si non calculable — voir `notComputableReasonExecutives`.",
			example: 64.5,
		},
		notComputableReasonExecutives: {
			type: ["string", "null"],
			enum: ["aucun_cadre_dirigeant", "un_seul_cadre_dirigeant", null],
			description:
				"Raison de non-calculabilité de l'écart parmi les cadres dirigeants. `null` si l'écart est calculable.",
			example: null,
		},
		memberWomenPercent: {
			type: ["number", "null"],
			description:
				"Part de femmes parmi les membres des instances dirigeantes, en pourcentage (entre 0 et 100). `null` si non calculable — voir `notComputableReasonMembers`.",
			example: 42,
		},
		memberMenPercent: {
			type: ["number", "null"],
			description:
				"Part d'hommes parmi les membres des instances dirigeantes, en pourcentage (entre 0 et 100). `null` si non calculable — voir `notComputableReasonMembers`.",
			example: 58,
		},
		notComputableReasonMembers: {
			type: ["string", "null"],
			enum: ["aucune_instance_dirigeante", null],
			description:
				"Raison de non-calculabilité de l'écart parmi les instances dirigeantes. `null` si l'écart est calculable.",
			example: null,
		},
		publishDate: {
			type: ["string", "null"],
			description:
				"Date de publication des résultats (YYYY-MM-DD). `null` si non renseignée.",
			example: "2026-02-15",
		},
		publishUrl: {
			type: ["string", "null"],
			description:
				"URL de publication des résultats. `null` si non renseignée.",
			example: "https://exemple.fr/egalite-professionnelle",
		},
		publishModalities: {
			type: ["string", "null"],
			description:
				"Modalités de publication en texte libre (ex. affichage interne), utilisées quand aucune URL n'est renseignée. `null` sinon.",
			example: "Affichage dans les locaux de l'entreprise",
		},
	},
} as const;

export const publicRepresentationSearchResultSchema = {
	type: "object",
	required: ["data", "count"],
	properties: {
		data: {
			type: "array",
			items: publicRepresentationSchema,
			description: "Liste des déclarations correspondant à la recherche.",
		},
		count: {
			type: "integer",
			description: "Nombre total de résultats (avant pagination).",
			example: 42,
		},
	},
} as const;

export const representationsPaths = {
	"/api/public/representations": {
		get: {
			operationId: "searchPublicRepresentations",
			summary: "Rechercher des déclarations de représentation équilibrée",
			description:
				"Recherche paginée sur les déclarations de représentation équilibrée (art. D. 1142-19) soumises. Les résultats sont filtrables par texte libre, région, département, code NAF et année. Les brouillons ne sont jamais inclus.",
			parameters: buildSearchParameters({
				description: "Filtre par année de référence de la déclaration.",
				example: 2026,
			}),
			responses: {
				"200": {
					description:
						"Liste paginée de déclarations de représentation équilibrée.",
					headers: {
						"Access-Control-Allow-Origin": corsAllowOriginHeader,
					},
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/PublicRepresentationSearchResult",
							},
						},
					},
				},
				"400": invalidParamsResponse("Paramètres invalides."),
				"500": serverErrorResponse,
			},
		},
	},
	"/api/public/representations/{siren}": {
		get: {
			operationId: "getPublicRepresentationsBySiren",
			summary:
				"Lister les déclarations de représentation équilibrée d'une entreprise",
			description:
				"Retourne toutes les déclarations de représentation équilibrée soumises pour le SIREN donné, triées par année décroissante. Les brouillons ne sont jamais retournés.",
			parameters: [sirenParam, limitOnlyParam],
			responses: {
				"200": {
					description:
						"Liste des déclarations de représentation équilibrée soumises pour ce SIREN.",
					content: {
						"application/json": {
							schema: {
								type: "array",
								items: { $ref: "#/components/schemas/PublicRepresentation" },
							},
						},
					},
				},
				"400": invalidParamsResponse("SIREN invalide."),
				"500": serverErrorResponse,
			},
		},
	},
	"/api/public/representations/{siren}/{year}": {
		get: {
			operationId: "getPublicRepresentationBySirenYear",
			summary:
				"Consulter une déclaration de représentation équilibrée par SIREN et année",
			description:
				"Retourne la déclaration de représentation équilibrée soumise pour le SIREN et l'année (de référence) donnés. Retourne 404 si aucune déclaration soumise n'existe pour cette année (brouillon ou absence de déclaration).",
			parameters: [
				sirenParam,
				{
					name: "year",
					in: "path",
					required: true,
					description: "Année de référence de la déclaration (YYYY).",
					example: 2026,
					schema: { type: "integer", minimum: 2000 },
				},
			],
			responses: {
				"200": {
					description: "Déclaration de représentation équilibrée soumise.",
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/PublicRepresentation" },
						},
					},
				},
				"400": invalidParamsResponse("SIREN ou année invalide."),
				"404": notFoundResponse(
					"Déclaration non trouvée ou non soumise (brouillon).",
				),
				"500": serverErrorResponse,
			},
		},
	},
} as const;

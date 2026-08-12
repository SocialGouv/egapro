import { sirenParam } from "./openapiShared";

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
					description: "Filtre par année de référence de la déclaration.",
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
					description:
						"Liste paginée de déclarations de représentation équilibrée.",
					headers: {
						"Access-Control-Allow-Origin": {
							schema: { type: "string" },
							description:
								"Toujours `*` — accessible depuis n'importe quelle origine.",
						},
					},
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/PublicRepresentationSearchResult",
							},
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
	"/api/public/representations/{siren}": {
		get: {
			operationId: "getPublicRepresentationsBySiren",
			summary:
				"Lister les déclarations de représentation équilibrée d'une entreprise",
			description:
				"Retourne toutes les déclarations de représentation équilibrée soumises pour le SIREN donné, triées par année décroissante. Les brouillons ne sont jamais retournés.",
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
				"400": {
					description: "SIREN ou année invalide.",
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/Error" },
						},
					},
				},
				"404": {
					description: "Déclaration non trouvée ou non soumise (brouillon).",
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
} as const;

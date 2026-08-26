export const errorSchema = {
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

export const sirenParam = {
	name: "siren",
	in: "path",
	required: true,
	description: "SIREN de l'entreprise (9 chiffres).",
	example: "319159877",
	schema: { type: "string", pattern: "^\\d{9}$" },
} as const;

export const limitOnlyParam = {
	name: "limit",
	in: "query",
	required: false,
	description: "Nombre maximal de résultats. Entre 1 et 100.",
	example: 10,
	schema: { type: "integer", minimum: 1, maximum: 100 },
} as const;

export const corsAllowOriginHeader = {
	schema: { type: "string" },
	description: "Toujours `*` — accessible depuis n'importe quelle origine.",
} as const;

export function errorResponse(description: string) {
	return {
		description,
		content: {
			"application/json": { schema: { $ref: "#/components/schemas/Error" } },
		},
	} as const;
}

export const serverErrorResponse = {
	description: "Erreur serveur.",
	content: {
		"application/json": { schema: { $ref: "#/components/schemas/Error" } },
	},
} as const;

export const publicNonDiffusibleIdentityProperties = {
	name: {
		type: ["string", "null"],
		description:
			"Raison sociale. Masquée lorsque l'entreprise n'est pas diffusible.",
		example: "THALES LAS FRANCE SAS",
	},
	address: {
		type: ["string", "null"],
		description: "Adresse. Masquée lorsque l'entreprise n'est pas diffusible.",
		example: "2 AVENUE GAY-LUSSAC, 78990 ELANCOURT",
	},
	region: {
		type: ["string", "null"],
		description: "Région française, si applicable.",
		example: "Île-de-France",
	},
	departmentCode: {
		type: ["string", "null"],
		description:
			"Code département, conservé pour les entreprises non diffusibles.",
		example: "78",
	},
	departmentLabel: {
		type: ["string", "null"],
		description:
			"Libellé département, conservé pour les entreprises non diffusibles.",
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
} as const;

export function buildSearchParameters(year: {
	description: string;
	example: number;
}) {
	return [
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
			description: "Filtre par code de région (ex. `11` pour Île-de-France).",
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
			description: year.description,
			example: year.example,
			schema: { type: "integer" },
		},
		{
			name: "limit",
			in: "query",
			required: false,
			description: "Nombre de résultats par page. Entre 1 et 100. Défaut : 10.",
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
	] as const;
}

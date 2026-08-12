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

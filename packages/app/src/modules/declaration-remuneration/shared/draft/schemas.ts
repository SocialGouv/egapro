import { z } from "zod";

import { sirenSchema } from "~/modules/admin";

const yearSchema = z.number().int().gte(2000).lte(2100);
const kindSchema = z.enum(["main", "second", "joint", "compliance", "cse"]);

export const getDraftInput = z.object({
	year: yearSchema,
	siren: sirenSchema,
});

export const saveDraftInput = z.object({
	year: yearSchema,
	siren: sirenSchema,
	slice: z.object({
		kind: kindSchema,
		step: z.string().min(1),
		data: z.record(z.string(), z.unknown()),
	}),
});

export const clearDraftInput = z.object({
	year: yearSchema,
	siren: sirenSchema,
	kind: kindSchema.optional(),
	step: z.string().min(1).optional(),
});

export type GetDraftInput = z.infer<typeof getDraftInput>;
export type SaveDraftInput = z.infer<typeof saveDraftInput>;
export type ClearDraftInput = z.infer<typeof clearDraftInput>;
export type DraftBlob = Record<string, Record<string, unknown>>;

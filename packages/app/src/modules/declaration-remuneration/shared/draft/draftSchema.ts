import { z } from "zod";

import { sirenSchema } from "~/modules/admin/schemas";

export const draftPayloadSchema = z.object({
	siren: sirenSchema,
	year: z.number().int(),
	step: z.union([
		z.number().int().min(1).max(6),
		z.literal("second-1"),
		z.literal("second-2"),
		z.literal("joint"),
		z.literal("compliance"),
		z.literal("opinions"),
		z.literal("upload"),
	]),
	kind: z.enum(["main", "second", "joint", "compliance", "cse"]),
	timestamp: z.number().int(),
	fields: z.record(z.string(), z.unknown()),
});

export type DraftPayload = z.infer<typeof draftPayloadSchema>;

export type DraftStep = DraftPayload["step"];
export type DraftKind = DraftPayload["kind"];

import { z } from "zod";

export const opinionTypeSchema = z.enum(["favorable", "unfavorable"]);

const declarationOpinionSchema = z.object({
	accuracyOpinion: opinionTypeSchema,
	accuracyDate: z.string().min(1),
	gapConsulted: z.boolean(),
	gapOpinion: opinionTypeSchema.nullable(),
	gapDate: z.string().nullable(),
});

export const saveOpinionsSchema = z.object({
	firstDeclaration: declarationOpinionSchema,
	secondDeclaration: declarationOpinionSchema.optional(),
});

export type SaveOpinionsInput = z.infer<typeof saveOpinionsSchema>;

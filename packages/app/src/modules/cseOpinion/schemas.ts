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

export const uploadFileSchema = z.object({
	fileName: z
		.string()
		.min(1)
		.regex(/\.pdf$/i, "Le fichier doit être un PDF."),
	filePath: z
		.string()
		.min(1)
		.regex(
			/^[a-z0-9]{9}\/\d{4}\/[a-z0-9-]+\.[a-z]+$/,
			"Chemin de fichier invalide.",
		),
});

export const deleteFileSchema = z.object({
	fileId: z.string().min(1),
});

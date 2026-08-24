import { z } from "zod";

export const resendReceiptSchema = z.object({
	kind: z.enum([
		"declaration",
		"secondDeclaration",
		"cseOpinion",
		"representation",
	]),
	year: z.number().int().min(2019).max(2100),
});

export type ResendReceiptInput = z.infer<typeof resendReceiptSchema>;

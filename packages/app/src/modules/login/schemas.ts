import { z } from "zod";

/**
 * Dev-only sign-in form. Mirrors the two fields the ProConnect profile
 * actually drives downstream: the email that identifies the user row, and
 * the SIRET the session is bound to (the declaration funnel reads its SIREN
 * from there).
 */
export const devLoginSchema = z.object({
	email: z.string().email("Adresse e-mail invalide."),
	siret: z
		.string()
		.transform((value) => value.replace(/\s/g, ""))
		.pipe(
			z
				.string()
				.regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres."),
		),
});

export type DevLoginInput = z.infer<typeof devLoginSchema>;

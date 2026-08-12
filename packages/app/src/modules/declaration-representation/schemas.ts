import { z } from "zod";
import { isRepresentationPublicationRequired } from "~/modules/domain";

function isTolerantUrl(value: string): boolean {
	const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
	try {
		return new URL(candidate).hostname.includes(".");
	} catch {
		return false;
	}
}

function parseIsoDate(value: string): Date {
	return new Date(value);
}

function isTwelveConsecutiveMonths(start: string, end: string): boolean {
	const startDate = parseIsoDate(start);
	const expectedEnd = new Date(startDate);
	expectedEnd.setUTCFullYear(expectedEnd.getUTCFullYear() + 1);
	expectedEnd.setUTCDate(expectedEnd.getUTCDate() - 1);
	return parseIsoDate(end).getTime() === expectedEnd.getTime();
}

function sumsToOneHundred(a: number, b: number): boolean {
	return Math.round((a + b) * 10) / 10 === 100;
}

const percentSchema = z
	.number()
	.min(0, "Le pourcentage doit être compris entre 0 et 100.")
	.max(100, "Le pourcentage doit être compris entre 0 et 100.")
	.multipleOf(0.1, "Le pourcentage ne peut comporter plus d'une décimale.");

export const subjectionSchema = z
	.object({
		answer: z.enum(["concerned", "not_concerned"]).nullable(),
	})
	.refine((data) => data.answer !== null, {
		message: "Veuillez sélectionner une option pour continuer.",
		path: ["answer"],
	});

export function referencePeriodSchema(year: number) {
	return z
		.object({
			referencePeriodStart: z.string().date(),
			referencePeriodEnd: z.string().date(),
		})
		.refine(
			(period) =>
				parseIsoDate(period.referencePeriodEnd).getUTCFullYear() === year,
			{
				message:
					"L'année de la date de fin de la période de référence doit correspondre à l'année au titre de laquelle les écarts sont calculés.",
				path: ["referencePeriodEnd"],
			},
		)
		.refine(
			(period) =>
				isTwelveConsecutiveMonths(
					period.referencePeriodStart,
					period.referencePeriodEnd,
				),
			{
				message: "La période de référence doit couvrir 12 mois consécutifs.",
				path: ["referencePeriodEnd"],
			},
		);
}

export const executivesCountSchema = z.enum(["none", "one", "two_or_more"]);

export const executivesSchema = z
	.discriminatedUnion("executivesCount", [
		z.object({ executivesCount: z.literal("none") }),
		z.object({ executivesCount: z.literal("one") }),
		z.object({
			executivesCount: z.literal("two_or_more"),
			executiveWomenPercent: percentSchema,
			executiveMenPercent: percentSchema,
		}),
	])
	.refine(
		(data) =>
			data.executivesCount !== "two_or_more" ||
			sumsToOneHundred(data.executiveWomenPercent, data.executiveMenPercent),
		{
			message: "La somme des pourcentages doit être égale à 100 %.",
			path: ["executiveMenPercent"],
		},
	);

export const membersSchema = z
	.discriminatedUnion("hasManagementBody", [
		z.object({ hasManagementBody: z.literal(false) }),
		z.object({
			hasManagementBody: z.literal(true),
			memberWomenPercent: percentSchema,
			memberMenPercent: percentSchema,
		}),
	])
	.refine(
		(data) =>
			!data.hasManagementBody ||
			sumsToOneHundred(data.memberWomenPercent, data.memberMenPercent),
		{
			message: "La somme des pourcentages doit être égale à 100 %.",
			path: ["memberMenPercent"],
		},
	);

export const publicationSchema = z
	.object({ publishDate: z.string().date() })
	.and(
		z.discriminatedUnion("hasWebsite", [
			z.object({
				hasWebsite: z.literal(true),
				publishUrl: z
					.string()
					.trim()
					.min(1, "L'adresse de la page internet est obligatoire.")
					.max(500, "L'adresse de la page internet est trop longue.")
					.refine(isTolerantUrl, "L'adresse de la page internet est invalide."),
			}),
			z.object({
				hasWebsite: z.literal(false),
				publishModalities: z
					.string()
					.trim()
					.min(
						1,
						"La description des modalités de communication est obligatoire.",
					)
					.max(
						5000,
						"La description des modalités de communication est trop longue.",
					),
			}),
		]),
	);

const optionalPublicationFieldsSchema = z.object({
	publishDate: z.string().date().optional(),
	hasWebsite: z.boolean().optional(),
	publishUrl: z.string().max(500).optional(),
	publishModalities: z.string().max(5000).optional(),
});

export function submitRepresentationSchema(year: number) {
	return referencePeriodSchema(year)
		.and(executivesSchema)
		.and(membersSchema)
		.and(optionalPublicationFieldsSchema)
		.superRefine((data, ctx) => {
			const publicationRequired = isRepresentationPublicationRequired(
				data.executivesCount,
				data.hasManagementBody,
			);

			if (!publicationRequired) {
				if (
					data.publishDate !== undefined ||
					data.hasWebsite !== undefined ||
					data.publishUrl !== undefined ||
					data.publishModalities !== undefined
				) {
					ctx.addIssue({
						code: "custom",
						message:
							"Aucune information de publication n'est requise lorsqu'aucun écart n'est calculable.",
						path: ["publishDate"],
					});
				}
				return;
			}

			const result = publicationSchema.safeParse({
				publishDate: data.publishDate,
				hasWebsite: data.hasWebsite,
				publishUrl: data.publishUrl,
				publishModalities: data.publishModalities,
			});

			if (!result.success) {
				for (const issue of result.error.issues) {
					ctx.addIssue({
						code: "custom",
						message: issue.message,
						path: issue.path,
					});
				}
				return;
			}

			if (
				parseIsoDate(result.data.publishDate).getTime() <=
				parseIsoDate(data.referencePeriodEnd).getTime()
			) {
				ctx.addIssue({
					code: "custom",
					message:
						"La date de publication doit être postérieure à la fin de la période de référence.",
					path: ["publishDate"],
				});
			}
		});
}

export const representationDraftSchema = z.object({
	currentStep: z.number().int().min(0).max(5),
	referencePeriodStart: z.string().optional(),
	referencePeriodEnd: z.string().optional(),
	executivesCount: executivesCountSchema.optional(),
	executiveWomenPercent: z.number().optional(),
	executiveMenPercent: z.number().optional(),
	hasManagementBody: z.boolean().optional(),
	memberWomenPercent: z.number().optional(),
	memberMenPercent: z.number().optional(),
	hasWebsite: z.boolean().optional(),
	publishDate: z.string().optional(),
	publishUrl: z.string().max(500).optional(),
	publishModalities: z.string().max(5000).optional(),
});

const yearSchema = z.number().int().gte(2000).lte(2100);

export const getRepresentationDeclarationSchema = z.object({
	year: yearSchema,
});

export const saveRepresentationDraftSchema = z.object({
	year: yearSchema,
	draft: representationDraftSchema,
	currentStep: z.number().int().min(0).max(5),
});

export const submitRepresentationDeclarationSchema = z.object({
	year: yearSchema,
	payload: z.record(z.string(), z.unknown()),
});

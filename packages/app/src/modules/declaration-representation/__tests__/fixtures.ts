import type { ZodError } from "zod";

export const REPRESENTATION_YEAR = 2025;

export const MAX_PUBLISH_URL_LENGTH = 500;

export const MAX_PUBLISH_MODALITIES_LENGTH = 5000;

export const VALID_REFERENCE_PERIOD = {
	referencePeriodStart: "2025-01-01",
	referencePeriodEnd: "2025-12-31",
};

export const COMPUTABLE_EXECUTIVES = {
	executivesCount: "two_or_more",
	executiveWomenPercent: 60,
	executiveMenPercent: 40,
} as const;

export const MISMATCHED_EXECUTIVES = {
	executivesCount: "two_or_more",
	executiveWomenPercent: 35,
	executiveMenPercent: 50,
} as const;

export const NO_EXECUTIVES = { executivesCount: "none" } as const;

export const SINGLE_EXECUTIVE = { executivesCount: "one" } as const;

export const COMPUTABLE_MEMBERS = {
	hasManagementBody: true,
	memberWomenPercent: 55,
	memberMenPercent: 45,
} as const;

export const NO_MANAGEMENT_BODY = { hasManagementBody: false } as const;

export const WEBSITE_PUBLICATION = {
	publishDate: "2026-03-01",
	hasWebsite: true,
	publishUrl: "https://exemple.fr/egalite-professionnelle",
} as const;

export const OFFLINE_PUBLICATION = {
	publishDate: "2026-03-01",
	hasWebsite: false,
	publishModalities: "Affichage dans les locaux et note de service.",
} as const;

export const FULL_REPRESENTATION_PAYLOAD = {
	...VALID_REFERENCE_PERIOD,
	...COMPUTABLE_EXECUTIVES,
	...COMPUTABLE_MEMBERS,
	...WEBSITE_PUBLICATION,
};

export const NOT_COMPUTABLE_PAYLOAD = {
	...VALID_REFERENCE_PERIOD,
	...NO_EXECUTIVES,
	...NO_MANAGEMENT_BODY,
};

export const VALIDATION_MESSAGES = {
	selectionRequired: "Veuillez sélectionner une option pour continuer.",
	sum: "La somme des pourcentages doit être égale à 100 %.",
	range: "Le pourcentage doit être compris entre 0 et 100.",
	decimal: "Le pourcentage ne peut comporter plus d'une décimale.",
	periodYear: (year: number) =>
		`La date sélectionnée ne correspond pas à l'année de référence ${year}.`,
	periodLength: "La période de référence doit couvrir 12 mois consécutifs.",
	urlRequired: "L'adresse de la page internet est obligatoire.",
	urlInvalid: "L'adresse de la page internet est invalide.",
	urlTooLong: "L'adresse de la page internet est trop longue.",
	modalitiesRequired:
		"La description des modalités de communication est obligatoire.",
	modalitiesTooLong:
		"La description des modalités de communication est trop longue.",
	publicationNotRequired:
		"Aucune information de publication n'est requise lorsqu'aucun écart n'est calculable.",
	publishDateAfterPeriod:
		"La date de publication doit être postérieure à la fin de la période de référence.",
	publishDateRequired:
		"Indiquez la date de publication des écarts calculables.",
	websiteAnswerRequired:
		"Précisez si l'entreprise a un site Internet pour publier les écarts calculables.",
} as const;

export const ZOD_UNTRANSLATED_MESSAGE = "Invalid input";

export function issues(result: { success: boolean; error?: ZodError }) {
	return (
		result.error?.issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
		})) ?? []
	);
}

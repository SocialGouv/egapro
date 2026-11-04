import type { DocumentProps } from "@react-pdf/renderer";

import { PDF_LANGUAGE } from "./pdfLanguage";

export const PDF_AUTHOR = "Ministère du Travail et des Solidarités";

const PDF_KEYWORDS = "Egapro, égalité professionnelle, femmes-hommes";

export function pdfDocumentMetadata({
	title,
	subject,
	siren,
}: {
	title: string;
	subject: string;
	siren: string;
}): DocumentProps {
	return {
		title,
		subject,
		author: PDF_AUTHOR,
		keywords: `${PDF_KEYWORDS}, SIREN ${siren}`,
		creator: "Egapro",
		producer: "Egapro",
		language: PDF_LANGUAGE,
	};
}

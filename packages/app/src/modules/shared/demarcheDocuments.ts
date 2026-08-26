export type DemarcheDocument = {
	dataYear: number;
	href: string;
	title: string;
	year: number;
};

type RemunerationDocumentsInput = {
	dataYear: number;
	hasSecondDeclaration: boolean;
	hasTransmittedElements: boolean;
	year: number;
};

export function buildRemunerationDocuments({
	dataYear,
	hasSecondDeclaration,
	hasTransmittedElements,
	year,
}: RemunerationDocumentsInput): DemarcheDocument[] {
	const documents: DemarcheDocument[] = [
		{
			dataYear,
			href: `/api/declaration-pdf?year=${year}`,
			title: "Télécharger le récapitulatif de la déclaration des indicateurs",
			year,
		},
	];

	if (hasSecondDeclaration) {
		documents.push({
			dataYear,
			href: `/api/declaration-pdf?type=correction&year=${year}`,
			title:
				"Télécharger le récapitulatif de la seconde déclaration de l'indicateur par catégories de salariés",
			year,
		});
	}

	if (hasTransmittedElements) {
		documents.push({
			dataYear,
			href: `/api/transmitted-pdf?year=${year}`,
			title: "Télécharger le récapitulatif des éléments transmis",
			year,
		});
	}

	return documents;
}

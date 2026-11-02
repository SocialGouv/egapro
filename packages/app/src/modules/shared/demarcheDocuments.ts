import {
	API_DECLARATION_PDF,
	API_JOINT_EVALUATION_PDF,
	API_TRANSMITTED_PDF,
} from "~/modules/routes";

export const JOINT_EVALUATION_RECAP_TITLE =
	"Télécharger le récapitulatif de l'évaluation conjointe des rémunérations";

export type DemarcheDocument = {
	dataYear: number;
	href: string;
	title: string;
	year: number;
};

type TransmittedElementsInput = {
	hasSubmittedCseOpinion: boolean;
	hasSubmittedJointEvaluation: boolean;
};

// The transmitted-elements PDF gathers the CSE opinions and the joint
// evaluation report, so it is offered as soon as either has been submitted —
// a company without a CSE that chose the joint evaluation path has one too.
export function offersTransmittedElements({
	hasSubmittedCseOpinion,
	hasSubmittedJointEvaluation,
}: TransmittedElementsInput): boolean {
	return hasSubmittedCseOpinion || hasSubmittedJointEvaluation;
}

type RemunerationDocumentsInput = {
	dataYear: number;
	hasSecondDeclaration: boolean;
	hasTransmittedElements: boolean;
	hasTransmittedJointEvaluation: boolean;
	year: number;
};

export function buildRemunerationDocuments({
	dataYear,
	hasSecondDeclaration,
	hasTransmittedElements,
	hasTransmittedJointEvaluation,
	year,
}: RemunerationDocumentsInput): DemarcheDocument[] {
	const documents: DemarcheDocument[] = [
		{
			dataYear,
			href: `${API_DECLARATION_PDF}?year=${year}`,
			title: "Télécharger le récapitulatif de la déclaration des indicateurs",
			year,
		},
	];

	if (hasSecondDeclaration) {
		documents.push({
			dataYear,
			href: `${API_DECLARATION_PDF}?type=correction&year=${year}`,
			title:
				"Télécharger le récapitulatif de la seconde déclaration de l'indicateur par catégorie d'emplois",
			year,
		});
	}

	if (hasTransmittedJointEvaluation) {
		documents.push({
			dataYear,
			href: `${API_JOINT_EVALUATION_PDF}?year=${year}`,
			title: JOINT_EVALUATION_RECAP_TITLE,
			year,
		});
	}

	if (hasTransmittedElements) {
		documents.push({
			dataYear,
			href: `${API_TRANSMITTED_PDF}?year=${year}`,
			title: "Télécharger le récapitulatif des éléments transmis",
			year,
		});
	}

	return documents;
}

import {
	API_CSE_OPINION_PDF,
	API_DECLARATION_PDF,
	API_JOINT_EVALUATION_PDF,
} from "~/modules/routes";

export const JOINT_EVALUATION_RECAP_TITLE =
	"Télécharger le récapitulatif de l'évaluation conjointe des rémunérations";

export const CSE_OPINION_RECAP_TITLE =
	"Télécharger le récapitulatif de la transmission du ou des avis du CSE";

export type DemarcheDocument = {
	dataYear: number;
	href: string;
	title: string;
	year: number;
};

type RemunerationDocumentsInput = {
	dataYear: number;
	hasSecondDeclaration: boolean;
	hasSubmittedCseOpinion: boolean;
	hasTransmittedJointEvaluation: boolean;
	year: number;
};

export function buildRemunerationDocuments({
	dataYear,
	hasSecondDeclaration,
	hasSubmittedCseOpinion,
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

	if (hasSubmittedCseOpinion) {
		documents.push({
			dataYear,
			href: `${API_CSE_OPINION_PDF}?year=${year}`,
			title: CSE_OPINION_RECAP_TITLE,
			year,
		});
	}

	return documents;
}

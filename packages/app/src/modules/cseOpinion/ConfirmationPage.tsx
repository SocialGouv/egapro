import { DemarcheConfirmation } from "~/modules/shared/DemarcheConfirmation";
import { buildRemunerationDocuments } from "~/modules/shared/demarcheDocuments";

type Props = {
	companyName: string;
	dataYear: number;
	declarationYear: number;
	email?: string;
	hasSecondDeclaration?: boolean;
	hasTransmittedElements?: boolean;
	hasTransmittedJointEvaluation?: boolean;
};

export function ConfirmationPage({
	companyName,
	dataYear,
	declarationYear,
	email,
	hasSecondDeclaration = false,
	hasTransmittedElements = false,
	hasTransmittedJointEvaluation = false,
}: Props) {
	return (
		<DemarcheConfirmation
			companyName={companyName}
			documents={buildRemunerationDocuments({
				dataYear,
				hasSecondDeclaration,
				hasTransmittedElements,
				hasTransmittedJointEvaluation,
				year: declarationYear,
			})}
			email={email ?? "adresse@exemple.fr"}
			receiptKind="cseOpinion"
			receiptYear={declarationYear}
			successMessage={`Votre parcours ${declarationYear} est désormais terminé`}
			title={`Démarche des indicateurs de rémunération ${declarationYear}`}
		/>
	);
}

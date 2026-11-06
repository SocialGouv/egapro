import { DemarcheConfirmation } from "~/modules/shared/DemarcheConfirmation";
import { buildRemunerationDocuments } from "~/modules/shared/demarcheDocuments";

type Props = {
	companyName: string;
	dataYear: number;
	declarationYear: number;
	email?: string;
	hasSecondDeclaration?: boolean;
	hasSubmittedCseOpinion?: boolean;
	hasTransmittedJointEvaluation?: boolean;
};

export function ConfirmationPage({
	companyName,
	dataYear,
	declarationYear,
	email,
	hasSecondDeclaration = false,
	hasSubmittedCseOpinion = false,
	hasTransmittedJointEvaluation = false,
}: Props) {
	return (
		<DemarcheConfirmation
			companyName={companyName}
			documents={buildRemunerationDocuments({
				dataYear,
				hasSecondDeclaration,
				hasSubmittedCseOpinion,
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

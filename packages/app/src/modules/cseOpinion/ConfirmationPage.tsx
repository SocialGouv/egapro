import { DemarcheConfirmation } from "~/modules/shared/DemarcheConfirmation";
import { buildRemunerationDocuments } from "~/modules/shared/demarcheDocuments";

type Props = {
	dataYear: number;
	declarationYear: number;
	email?: string;
	hasSecondDeclaration?: boolean;
	hasTransmittedElements?: boolean;
};

export function ConfirmationPage({
	dataYear,
	declarationYear,
	email,
	hasSecondDeclaration = false,
	hasTransmittedElements = false,
}: Props) {
	return (
		<DemarcheConfirmation
			documents={buildRemunerationDocuments({
				dataYear,
				hasSecondDeclaration,
				hasTransmittedElements,
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

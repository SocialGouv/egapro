import { getReferenceYearFor } from "~/modules/domain";
import { DemarcheConfirmation } from "~/modules/shared/DemarcheConfirmation";
import {
	buildRemunerationDocuments,
	offersTransmittedElements,
} from "~/modules/shared/demarcheDocuments";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export async function ComplianceConfirmation() {
	const [session, data] = await Promise.all([
		auth(),
		api.declaration.getOrCreate(),
	]);
	const currentYear = data.declaration.year;

	return (
		<DemarcheConfirmation
			documents={buildRemunerationDocuments({
				dataYear: getReferenceYearFor(currentYear),
				hasSecondDeclaration: data.hasSubmittedSecondDeclaration,
				hasTransmittedElements: offersTransmittedElements(data),
				year: currentYear,
			})}
			email={session?.user?.email ?? "adresse@exemple.fr"}
			receiptKind={
				data.hasSubmittedSecondDeclaration ? "secondDeclaration" : "declaration"
			}
			receiptYear={currentYear}
			successMessage={`Votre parcours ${currentYear} est désormais terminé`}
			title={`Démarche des indicateurs de rémunération ${currentYear}`}
		/>
	);
}

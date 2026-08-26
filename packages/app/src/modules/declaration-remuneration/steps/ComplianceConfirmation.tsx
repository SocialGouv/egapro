import {
	COMPANY_SIZE_ANNUAL_MIN,
	getObligationWorkforce,
	getReferenceYearFor,
	isCseRequired,
} from "~/modules/domain";
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
	const company = await api.company.get({ siren: data.declaration.siren });

	// Branches on the workforce, not on hasCse: below the threshold no opinion is
	// ever due whatever the company answered, so that reason takes precedence —
	// and above it, the only way to land here is having no CSE.
	const noOpinionReason = isCseRequired(
		getObligationWorkforce(company.gipWorkforce),
	)
		? "Votre entreprise ne dispose pas de CSE."
		: `Votre effectif est inférieur à ${COMPANY_SIZE_ANNUAL_MIN} salariés.`;

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
		>
			<p className="fr-mb-0">{`${noOpinionReason} Aucun avis CSE n'est requis.`}</p>
		</DemarcheConfirmation>
	);
}

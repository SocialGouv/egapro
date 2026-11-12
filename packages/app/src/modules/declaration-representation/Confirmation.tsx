import { API_REPRESENTATION_PDF } from "~/modules/routes";
import { DemarcheConfirmation } from "~/modules/shared/DemarcheConfirmation";

type ConfirmationProps = {
	campaignYear: number;
	companyName: string;
	email: string | null;
	referenceYear: number;
};

export function Confirmation({
	campaignYear,
	companyName,
	email,
	referenceYear,
}: ConfirmationProps) {
	// The Figma frame has no documents heading; keep it for screen readers only.
	return (
		<DemarcheConfirmation
			companyName={companyName}
			documents={[
				{
					dataYear: referenceYear,
					href: `${API_REPRESENTATION_PDF}?year=${referenceYear}`,
					title: "Télécharger le récapitulatif de la déclaration",
					year: campaignYear,
				},
			]}
			documentsTitleHidden
			email={email ?? "renseignée sur votre compte"}
			receiptKind="representation"
			receiptYear={referenceYear}
			successMessage={`Votre parcours ${campaignYear} est désormais terminé`}
			title={`Démarche des indicateurs de représentation ${campaignYear}`}
		/>
	);
}

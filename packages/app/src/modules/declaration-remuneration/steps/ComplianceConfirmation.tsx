import Link from "next/link";
import { DownloadDeclarationPdfButton } from "~/modules/declarationPdf";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	getObligationWorkforce,
	isCseRequired,
} from "~/modules/domain";
import { DsfrPictogram } from "~/modules/layout";
import { FeedbackBanner } from "~/modules/shared/FeedbackBanner";
import { api } from "~/trpc/server";
import common from "../shared/common.module.scss";

export async function ComplianceConfirmation() {
	const data = await api.declaration.getOrCreate();
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
		<div className={common.flexColumnGap2}>
			<h1 className="fr-h4 fr-mb-0">
				Parcours de mise en conformité pour l&apos;indicateur par catégorie de
				salariés
			</h1>

			<div className="fr-mt-2w fr-mb-2w">
				<DsfrPictogram
					className="fr-artwork--green-emeraude"
					path="/dsfr/artwork/pictograms/system/success.svg"
					size={64}
				/>
			</div>

			<p className="fr-text--lg fr-text--bold fr-mb-0">
				Votre parcours de mise en conformité {currentYear} est terminé
			</p>

			<p className="fr-mb-0">
				{noOpinionReason} Aucun avis CSE n&apos;est requis.
			</p>

			<DownloadDeclarationPdfButton year={currentYear} />

			<FeedbackBanner />

			<div className="fr-mt-4w">
				<Link className="fr-btn" href="/mon-espace">
					Mon espace
				</Link>
			</div>
		</div>
	);
}

import Link from "next/link";
import { DownloadDeclarationPdfButton } from "~/modules/declarationPdf";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	getObligationWorkforce,
	isCseRequired,
} from "~/modules/domain";
import { DsfrPictogram } from "~/modules/layout";
import { ResendReceiptButton } from "~/modules/mail";
import { FeedbackBanner } from "~/modules/shared/FeedbackBanner";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import common from "../shared/common.module.scss";

export async function ComplianceConfirmation() {
	const [session, data] = await Promise.all([
		auth(),
		api.declaration.getOrCreate(),
	]);
	const currentYear = data.declaration.year;
	const company = await api.company.get({ siren: data.declaration.siren });
	const displayEmail = session?.user?.email ?? "adresse@exemple.fr";

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

			{/* Without this, a user who lands here has no trace at all that an
			    acknowledgement was sent, and no way to ask for it again — the
			    sibling end-of-funnel screen has had both all along (issue 3914). */}
			<div className={common.flexColumnGapHalf}>
				<p className="fr-text--sm fr-mb-0">
					Un accusé de réception a été envoyé à l&apos;adresse e-mail{" "}
					<strong>{displayEmail}</strong>.
				</p>
				<p className="fr-text--sm fr-text--mention-grey fr-mb-0">
					Si ce n&apos;est pas le cas, vérifiez vos courriers indésirables ou
					SPAM. Sinon, cliquez sur le bouton ci-dessous.
				</p>
				<ResendReceiptButton kind="declaration" year={currentYear} />
			</div>

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

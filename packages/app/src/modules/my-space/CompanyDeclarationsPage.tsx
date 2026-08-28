import type {
	CampaignDeadlines,
	RepresentationCampaign,
} from "~/modules/domain";
import {
	getCurrentYear,
	getDeclarationDisplayContext,
	getObligationWorkforce,
	isCseOpinionRequired,
	isCseRequired,
	isIndicatorGRequired,
} from "~/modules/domain";

import { ArchivesSection } from "./ArchivesSection";
import { hasArchives } from "./archivesAvailability";
import { CompanyEditModal } from "./CompanyEditModal";
import { CompanyInfoBanner } from "./CompanyInfoBanner";
import { DeclarationProcessPanel } from "./DeclarationProcessPanel";
import { DeclarationsSection } from "./DeclarationsSection";
import { computeCtaHref, computePanelVariant } from "./declarationProcessState";
import { MissingInfoModal } from "./MissingInfoModal";
import type {
	CompanyDetail,
	DeclarationItem,
	LockHolderDisplay,
} from "./types";
import { WelcomeBanner } from "./WelcomeBanner";

type Props = {
	campaignDeadlines: CampaignDeadlines;
	company: CompanyDetail;
	declarations: DeclarationItem[];
	lockedByOther: boolean;
	lockHolder: LockHolderDisplay | null;
	representationCampaign: RepresentationCampaign;
	userPhone: string | null;
};

function getLastActionDate(
	declarations: DeclarationItem[],
	year: number,
): string | null {
	const currentYearDeclaration = declarations.find(
		(d) => d.type === "remuneration" && d.year === year && d.updatedAt,
	);
	if (!currentYearDeclaration?.updatedAt) return null;

	return new Intl.DateTimeFormat("fr-FR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(currentYearDeclaration.updatedAt);
}

export function CompanyDeclarationsPage({
	campaignDeadlines,
	company,
	declarations,
	lockedByOther,
	lockHolder,
	representationCampaign,
	userPhone,
}: Props) {
	const currentYear = getCurrentYear();
	const obligationWorkforce = getObligationWorkforce(company.gipWorkforce);
	const cseApplicable = isCseRequired(obligationWorkforce);
	const cseOpinionRequired = isCseOpinionRequired({
		workforce: obligationWorkforce,
		hasCse: company.hasCse,
	});
	const indicatorGRequired = isIndicatorGRequired(
		obligationWorkforce,
		currentYear,
	);
	const compliancePathApplicable = cseApplicable && indicatorGRequired;
	const lastActionDate = getLastActionDate(declarations, currentYear);
	const currentDeclaration = declarations.find(
		(d) => d.type === "remuneration" && d.year === currentYear,
	);
	const panelVariant = computePanelVariant(currentDeclaration);
	const ctaHref = computeCtaHref(currentDeclaration, company.siren);
	const displayContext = getDeclarationDisplayContext({
		firstDeclarationPathChoice:
			currentDeclaration?.firstDeclarationPathChoice ?? null,
		secondDeclarationPathChoice:
			currentDeclaration?.secondDeclarationPathChoice ?? null,
		cseRequired: currentDeclaration?.cseRequired ?? false,
	});

	return (
		<main id="content" tabIndex={-1}>
			<WelcomeBanner />
			<CompanyInfoBanner company={company} />
			<DeclarationsSection
				campaignDeadlines={campaignDeadlines}
				cseApplicable={cseApplicable}
				declarations={declarations}
				hasCse={company.hasCse}
				representationCampaign={representationCampaign}
				userPhone={userPhone}
			/>
			{hasArchives && <ArchivesSection />}
			<CompanyEditModal company={company} />
			<MissingInfoModal
				cseApplicable={cseApplicable}
				hasCse={company.hasCse}
				siren={company.siren}
				userPhone={userPhone}
			/>
			<DeclarationProcessPanel
				campaignDeadlines={campaignDeadlines}
				compliancePathApplicable={compliancePathApplicable}
				cseOpinionRequired={cseOpinionRequired}
				ctaHref={ctaHref}
				declarationFsmStatus={currentDeclaration?.fsmStatus ?? null}
				displayContext={displayContext}
				hasPrefillData={currentDeclaration?.hasPrefillData ?? false}
				indicatorGRequired={indicatorGRequired}
				hasSubmittedSecondDeclaration={
					currentDeclaration?.hasSubmittedSecondDeclaration ?? false
				}
				lastActionDate={lastActionDate}
				lockedByOther={lockedByOther}
				lockHolder={lockHolder}
				siren={company.siren}
				variant={panelVariant}
				year={currentYear}
			/>
		</main>
	);
}

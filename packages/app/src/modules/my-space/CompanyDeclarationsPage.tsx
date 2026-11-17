import type {
	CampaignDeadlines,
	RepresentationCampaign,
} from "~/modules/domain";
import {
	formatLongDate,
	getCurrentYear,
	getDeclarationDisplayContext,
	getObligationWorkforce,
	isCompliancePathStepApplicable,
	isCseAnswerLocked,
	isCseOpinionRequired,
	isCseRequired,
	isIndicatorGRequiredForGip,
	resolveCseAnswerForYear,
} from "~/modules/domain";

import { ArchivesSection } from "./ArchivesSection";
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
	isImpersonating: boolean;
	lockedByOther: boolean;
	lockHolder: LockHolderDisplay | null;
	representationLockedByOther?: boolean;
	representationLockHolder?: LockHolderDisplay | null;
	representationCampaign: RepresentationCampaign;
	representationCampaignYear: number;
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

	return formatLongDate(currentYearDeclaration.updatedAt);
}

export function CompanyDeclarationsPage({
	campaignDeadlines,
	company,
	declarations,
	isImpersonating,
	lockedByOther,
	lockHolder,
	representationLockedByOther = false,
	representationLockHolder = null,
	representationCampaign,
	representationCampaignYear,
	userPhone,
}: Props) {
	const currentYear = getCurrentYear();
	const obligationWorkforce = getObligationWorkforce(company.gipWorkforce);
	const cseApplicable = isCseRequired(obligationWorkforce);
	const currentDeclaration = declarations.find(
		(d) => d.type === "remuneration" && d.year === currentYear,
	);
	const cseAnswer = resolveCseAnswerForYear(
		currentDeclaration?.hasCse ?? null,
		company.hasCse,
	);
	const cseLocked = isCseAnswerLocked(currentDeclaration?.fsmStatus ?? null);
	const cseOpinionRequired = isCseOpinionRequired({
		workforce: obligationWorkforce,
		hasCse: cseAnswer,
	});
	const indicatorGRequired = isIndicatorGRequiredForGip(
		company.gipWorkforce,
		currentYear,
	);
	const lastActionDate = getLastActionDate(declarations, currentYear);
	const compliancePathApplicable =
		cseApplicable &&
		indicatorGRequired &&
		isCompliancePathStepApplicable({
			status: currentDeclaration?.fsmStatus ?? null,
			firstDeclarationPathChoice:
				currentDeclaration?.firstDeclarationPathChoice ?? null,
			secondDeclarationPathChoice:
				currentDeclaration?.secondDeclarationPathChoice ?? null,
		});
	const panelVariant = computePanelVariant(currentDeclaration);
	const ctaHref = computeCtaHref(currentDeclaration, isImpersonating);
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
			<CompanyInfoBanner company={company} cseLocked={cseLocked} />
			<DeclarationsSection
				cseApplicable={cseApplicable}
				declarations={declarations}
				hasCse={cseAnswer}
				representationCampaign={representationCampaign}
				representationCampaignYear={representationCampaignYear}
				representationLockedByOther={representationLockedByOther}
				representationLockHolder={representationLockHolder}
				userPhone={userPhone}
			/>
			<ArchivesSection />
			<CompanyEditModal company={company} />
			<MissingInfoModal
				cseApplicable={cseApplicable}
				cseLocked={cseLocked}
				hasCse={cseAnswer}
				siren={company.siren}
				userPhone={userPhone}
			/>
			<DeclarationProcessPanel
				campaignDeadlines={campaignDeadlines}
				compliancePathApplicable={compliancePathApplicable}
				cseOpinionRequired={cseOpinionRequired}
				cseOpinionViewAvailable={currentDeclaration?.cseOpinionViewAvailable}
				ctaHref={ctaHref}
				declarationFsmStatus={currentDeclaration?.fsmStatus ?? null}
				displayContext={displayContext}
				formalNoticeAvailable={
					currentDeclaration?.formalNoticeAvailable ?? false
				}
				hasPrefillData={currentDeclaration?.hasPrefillData ?? false}
				hasSubmittedCseOpinion={
					currentDeclaration?.hasSubmittedCseOpinion ?? false
				}
				hasSubmittedJointEvaluation={
					currentDeclaration?.hasSubmittedJointEvaluation ?? false
				}
				hasSubmittedSecondDeclaration={
					currentDeclaration?.hasSubmittedSecondDeclaration ?? false
				}
				indicatorGRequired={indicatorGRequired}
				jointEvaluationViewAvailable={
					currentDeclaration?.jointEvaluationViewAvailable
				}
				lastActionDate={lastActionDate}
				lastTransmission={currentDeclaration?.lastTransmission ?? null}
				lockedByOther={lockedByOther}
				lockHolder={lockHolder}
				siren={company.siren}
				variant={panelVariant}
				year={currentYear}
			/>
		</main>
	);
}

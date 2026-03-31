import { getCurrentYear, hasRequiredDeclarationInfo } from "~/modules/domain";

import { ArchivesSection } from "./ArchivesSection";
import { CompanyEditModal } from "./CompanyEditModal";
import { CompanyInfoBanner } from "./CompanyInfoBanner";
import { DeclarationProcessPanel } from "./DeclarationProcessPanel";
import { DeclarationsSection } from "./DeclarationsSection";
import { computeCtaHref, computePanelVariant } from "./declarationProcessState";
import { MissingInfoModal } from "./MissingInfoModal";
import type { CompanyDetail, DeclarationItem } from "./types";
import { WelcomeBanner } from "./WelcomeBanner";

type Props = {
	company: CompanyDetail;
	declarations: DeclarationItem[];
	hasNoSanction: boolean;
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
	company,
	declarations,
	hasNoSanction,
	userPhone,
}: Props) {
	const currentYear = getCurrentYear();
	const lastActionDate = getLastActionDate(declarations, currentYear);
	const currentDeclaration = declarations.find(
		(d) => d.type === "remuneration" && d.year === currentYear,
	);
	const panelVariant = computePanelVariant(currentDeclaration);
	const ctaHref = computeCtaHref(currentDeclaration, company.siren);

	return (
		<main id="content">
			<WelcomeBanner />
			<CompanyInfoBanner company={company} />
			<DeclarationsSection
				declarations={declarations}
				hasCse={company.hasCse}
				hasNoSanction={hasNoSanction}
				siren={company.siren}
				userPhone={userPhone}
			/>
			<ArchivesSection />
			<CompanyEditModal company={company} />
			{!hasRequiredDeclarationInfo(userPhone, company.hasCse) && (
				<MissingInfoModal
					hasCse={company.hasCse}
					siren={company.siren}
					userPhone={userPhone}
				/>
			)}
			<DeclarationProcessPanel
				compliancePath={currentDeclaration?.compliancePath ?? null}
				ctaHref={ctaHref}
				lastActionDate={lastActionDate}
				secondDeclarationStatus={
					currentDeclaration?.secondDeclarationStatus ?? null
				}
				siren={company.siren}
				variant={panelVariant}
				year={currentYear}
			/>
		</main>
	);
}

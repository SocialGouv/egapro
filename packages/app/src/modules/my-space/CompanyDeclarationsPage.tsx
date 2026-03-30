import { getCurrentYear } from "~/modules/domain";

import { ArchivesSection } from "./ArchivesSection";
import { CompanyEditModal } from "./CompanyEditModal";
import { CompanyInfoBanner } from "./CompanyInfoBanner";
import { DeclarationProcessPanel } from "./DeclarationProcessPanel";
import { DeclarationsSection } from "./DeclarationsSection";
import { MissingInfoModal } from "./MissingInfoModal";
import { computeCtaHref, computePanelVariant } from "./declarationProcessState";
import type { CompanyDetail, DeclarationItem } from "./types";
import { WelcomeBanner } from "./WelcomeBanner";

type Props = {
	company: CompanyDetail;
	declarations: DeclarationItem[];
	hasNoSanction: boolean;
	userPhone: string | null;
};

function getLastActionDate(declarations: DeclarationItem[]): string | null {
	const remunerationDeclarations = declarations.filter(
		(d) => d.type === "remuneration" && d.updatedAt,
	);
	if (remunerationDeclarations.length === 0) return null;

	const mostRecent = remunerationDeclarations.reduce((latest, d) =>
		d.updatedAt && (!latest.updatedAt || d.updatedAt > latest.updatedAt)
			? d
			: latest,
	);

	if (!mostRecent.updatedAt) return null;

	return new Intl.DateTimeFormat("fr-FR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(mostRecent.updatedAt);
}

export function CompanyDeclarationsPage({
	company,
	declarations,
	hasNoSanction,
	userPhone,
}: Props) {
	const currentYear = getCurrentYear();
	const lastActionDate = getLastActionDate(declarations);
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
			{(!userPhone || company.hasCse === null) && (
				<MissingInfoModal
					hasCse={company.hasCse}
					siren={company.siren}
					userPhone={userPhone}
				/>
			)}
			<DeclarationProcessPanel
				ctaHref={ctaHref}
				lastActionDate={lastActionDate}
				siren={company.siren}
				variant={panelVariant}
				year={currentYear}
			/>
		</main>
	);
}

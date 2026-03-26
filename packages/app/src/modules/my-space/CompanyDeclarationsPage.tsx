import { ResourceBanner } from "~/modules/layout";

import { ArchivesSection } from "./ArchivesSection";
import { CompanyEditModal } from "./CompanyEditModal";
import { CompanyInfoBanner } from "./CompanyInfoBanner";
import { DeclarationsSection } from "./DeclarationsSection";
import { MissingInfoModal } from "./MissingInfoModal";
import type { CompanyDetail, DeclarationItem } from "./types";
import { WelcomeBanner } from "./WelcomeBanner";

type Props = {
	company: CompanyDetail;
	declarations: DeclarationItem[];
	hasNoSanction: boolean;
	userPhone: string | null;
};

export function CompanyDeclarationsPage({
	company,
	declarations,
	hasNoSanction,
	userPhone,
}: Props) {
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
			<ResourceBanner />
			<CompanyEditModal company={company} />
			{(!userPhone || company.hasCse === null) && (
				<MissingInfoModal
					hasCse={company.hasCse}
					siren={company.siren}
					userPhone={userPhone}
				/>
			)}
		</main>
	);
}

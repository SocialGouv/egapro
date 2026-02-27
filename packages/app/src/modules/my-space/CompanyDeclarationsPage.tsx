import { ArchivesSection } from "./ArchivesSection";
import { CompanyInfoBanner } from "./CompanyInfoBanner";
import { DeclarationsSection } from "./DeclarationsSection";
import { MissingInfoModal } from "./MissingInfoModal";
import type { CompanyDetail, DeclarationItem } from "./types";

type Props = {
	company: CompanyDetail;
	declarations: DeclarationItem[];
	userPhone: string | null;
};

export function CompanyDeclarationsPage({
	company,
	declarations,
	userPhone,
}: Props) {
	return (
		<main id="content">
			<CompanyInfoBanner company={company} />
			<DeclarationsSection
				declarations={declarations}
				siren={company.siren}
				userPhone={userPhone}
			/>
			<ArchivesSection />
			{!userPhone && <MissingInfoModal siren={company.siren} />}
		</main>
	);
}

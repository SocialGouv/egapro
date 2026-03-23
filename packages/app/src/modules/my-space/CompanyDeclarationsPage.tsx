import { ArchivesSection } from "./ArchivesSection";
import { CompanyEditModal } from "./CompanyEditModal";
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
				hasCse={company.hasCse}
				siren={company.siren}
				userPhone={userPhone}
			/>
			<ArchivesSection />
			<CompanyEditModal company={company} />
			{(!userPhone || company.hasCse === null) && (
				<MissingInfoModal hasCse={company.hasCse} siren={company.siren} userPhone={userPhone} />
			)}
		</main>
	);
}

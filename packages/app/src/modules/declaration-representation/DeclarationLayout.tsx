import { CompanyBanner } from "~/modules/declaration-remuneration";
import { getReferenceYearFor } from "~/modules/domain";
import { RepresentationLockNotice } from "./shared/lock/RepresentationLockNotice";
import { RepresentationLockProvider } from "./shared/lock/RepresentationLockProvider";

type DeclarationLayoutProps = {
	company: {
		name: string;
		siren: string;
		gipWorkforce: number | null;
		hasCse: boolean | null;
	};
	campaignYear: number;
	year?: number;
	campaignOpen?: boolean;
	isSubmitted?: boolean;
	lockEnabled?: boolean;
	children: React.ReactNode;
};

export function DeclarationLayout({
	company,
	campaignYear,
	year,
	campaignOpen = true,
	isSubmitted = false,
	lockEnabled = false,
	children,
}: DeclarationLayoutProps) {
	return (
		<RepresentationLockProvider
			campaignOpen={campaignOpen}
			enabled={lockEnabled}
			isSubmitted={isSubmitted}
			year={year ?? getReferenceYearFor(campaignYear)}
		>
			<main id="content" tabIndex={-1}>
				<CompanyBanner
					company={company}
					currentPageLabel={`Démarche des indicateurs de représentation ${campaignYear}`}
				/>
				<div className="fr-container fr-py-7w">
					<div className="fr-grid-row fr-grid-row--center">
						<div className="fr-col-12 fr-col-lg-8">
							<RepresentationLockNotice />
							{children}
						</div>
					</div>
				</div>
			</main>
		</RepresentationLockProvider>
	);
}

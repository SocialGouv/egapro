import { CompanyBanner } from "~/modules/declaration-remuneration";

type DeclarationLayoutProps = {
	company: {
		name: string;
		siren: string;
		gipWorkforce: number | null;
		hasCse: boolean | null;
	};
	campaignYear: number;
	children: React.ReactNode;
};

export function DeclarationLayout({
	company,
	campaignYear,
	children,
}: DeclarationLayoutProps) {
	return (
		<main id="content" tabIndex={-1}>
			<CompanyBanner
				company={company}
				currentPageLabel={`Démarche des indicateurs de représentation ${campaignYear}`}
			/>
			<div className="fr-container fr-py-7w">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-lg-8">{children}</div>
				</div>
			</div>
		</main>
	);
}

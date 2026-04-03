import { CompanyBanner } from "./shared/CompanyBanner";

type CompanyData = {
	name: string;
	siren: string;
	workforce: number | null;
	hasCse: boolean | null;
};

type DeclarationLayoutProps = {
	company: CompanyData;
	declarationYear: number;
	children: React.ReactNode;
};

export function DeclarationLayout({
	company,
	declarationYear,
	children,
}: DeclarationLayoutProps) {
	return (
		<>
			<CompanyBanner
				company={company}
				currentPageLabel={`Démarche des indicateurs de rémunération ${declarationYear}`}
			/>
			<main className="fr-container fr-py-7w" id="content">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-lg-8">{children}</div>
				</div>
			</main>
		</>
	);
}

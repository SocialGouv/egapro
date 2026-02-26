import { CompanyBanner } from "./shared/CompanyBanner";

interface DeclarationLayoutProps {
	siren: string;
	children: React.ReactNode;
}

export function DeclarationLayout({ siren, children }: DeclarationLayoutProps) {
	const currentYear = new Date().getFullYear();
	return (
		<>
			<CompanyBanner
				currentPageLabel={`Démarche des indicateurs de rémunération ${currentYear}`}
				siren={siren}
			/>
			<main className="fr-container fr-py-7w" id="content">
				{children}
			</main>
		</>
	);
}

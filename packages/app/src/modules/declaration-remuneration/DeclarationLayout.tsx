import styles from "./DeclarationLayout.module.scss";
import { CompanyBanner } from "./shared/CompanyBanner";

type CompanyData = {
	name: string;
	siren: string;
	workforce: number | null;
	hasCse: boolean | null;
};

type DeclarationLayoutProps = {
	company: CompanyData;
	children: React.ReactNode;
};

export function DeclarationLayout({
	company,
	children,
}: DeclarationLayoutProps) {
	const currentYear = new Date().getFullYear();
	return (
		<>
			<CompanyBanner
				company={company}
				currentPageLabel={`Démarche des indicateurs de rémunération ${currentYear}`}
			/>
			<main className="fr-container fr-py-7w" id="content">
				<div className={styles.narrowContent}>{children}</div>
			</main>
		</>
	);
}

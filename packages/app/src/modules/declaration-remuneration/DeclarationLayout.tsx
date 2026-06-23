import { CompanyBanner } from "./shared/CompanyBanner";
import { DeclarationLockAlert } from "./shared/lock/DeclarationLockAlert";
import type { LockHolder } from "./shared/lock/LockContext";
import { LockProvider } from "./shared/lock/LockContext";

type CompanyData = {
	name: string;
	siren: string;
	nafCode: string | null;
	nafLabel: string | null;
	workforce: number | null;
	hasCse: boolean | null;
};

type DeclarationLayoutProps = {
	company: CompanyData;
	declarationYear: number;
	children: React.ReactNode;
	isReadOnly?: boolean;
	lockHolder?: LockHolder | null;
};

export function DeclarationLayout({
	company,
	declarationYear,
	children,
	isReadOnly = false,
	lockHolder = null,
}: DeclarationLayoutProps) {
	return (
		<>
			<CompanyBanner
				company={company}
				currentPageLabel={`Démarche des indicateurs de rémunération ${declarationYear}`}
			/>
			<main className="fr-container fr-py-7w" id="content">
				<LockProvider holder={lockHolder} isReadOnly={isReadOnly}>
					<div className="fr-grid-row fr-grid-row--center">
						<div className="fr-col-12 fr-col-lg-8">
							{isReadOnly && lockHolder && (
								<DeclarationLockAlert holder={lockHolder} />
							)}
							{children}
						</div>
					</div>
				</LockProvider>
			</main>
		</>
	);
}

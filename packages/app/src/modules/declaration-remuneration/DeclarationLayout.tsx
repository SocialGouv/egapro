import { RouteScrollReset } from "~/modules/layout";

import { CompanyBanner } from "./shared/CompanyBanner";
import { DeclarationLockAlertGate } from "./shared/lock/DeclarationLockAlertGate";
import { LockProvider } from "./shared/lock/LockContext";

type CompanyData = {
	name: string;
	siren: string;
	nafCode: string | null;
	nafLabel: string | null;
	gipWorkforce: number | null;
	hasCse: boolean | null;
};

type DeclarationLayoutProps = {
	company: CompanyData;
	declarationId: string;
	declarationYear: number;
	children: React.ReactNode;
	lockAcquisitionSuspended?: boolean;
};

export function DeclarationLayout({
	company,
	declarationId,
	declarationYear,
	children,
	lockAcquisitionSuspended = false,
}: DeclarationLayoutProps) {
	return (
		<main id="content" tabIndex={-1}>
			<RouteScrollReset />
			<CompanyBanner
				company={company}
				currentPageLabel={`Démarche des indicateurs de rémunération ${declarationYear}`}
			/>
			<div className="fr-container fr-py-7w">
				<LockProvider
					declarationId={declarationId}
					modificationClosed={lockAcquisitionSuspended}
				>
					<div className="fr-grid-row fr-grid-row--center">
						<div className="fr-col-12 fr-col-lg-8">
							<DeclarationLockAlertGate />
							{children}
						</div>
					</div>
				</LockProvider>
			</div>
		</main>
	);
}

import { DeclarationLockAlert } from "~/modules/declaration-remuneration/shared/lock/DeclarationLockAlert";
import type { LockHolder } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { LockProvider } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import {
	GIP_WORKFORCE_ABSENT_DISPLAY,
	getObligationWorkforce,
	getWorkforceYear,
	isCseRequired,
	toDisplayWorkforce,
} from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout";
import { formatSiren } from "~/modules/my-space";

import styles from "./CseOpinionLayout.module.scss";

type CompanyData = {
	name: string;
	siren: string;
	gipWorkforce: number | null;
	hasCse: boolean | null;
};

type Props = {
	company: CompanyData;
	declarationYear: number;
	children: React.ReactNode;
	isReadOnly?: boolean;
	lockHolder?: LockHolder | null;
};

export function CseOpinionLayout({
	company,
	declarationYear,
	children,
	isReadOnly = false,
	lockHolder = null,
}: Props) {
	const cseApplicable = isCseRequired(
		getObligationWorkforce(company.gipWorkforce),
	);

	return (
		<main id="content" tabIndex={-1}>
			<div className={`fr-py-3w ${styles.banner}`}>
				<div className="fr-container">
					<Breadcrumb
						items={[
							{ label: "Mon espace", href: "/" },
							{
								label: company.name,
								href: "/mon-espace",
							},
							{
								label: `Démarche des indicateurs de rémunération ${declarationYear}`,
							},
						]}
					/>

					<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
						<div className="fr-col-auto">
							<p
								className={`fr-text--bold fr-mb-0 fr-flex fr-flex--align-center ${styles.companyInfo}`}
							>
								<span aria-hidden="true" className="fr-icon-building-line" />
								{company.name} - {formatSiren(company.siren)}
							</p>
						</div>
						<div className="fr-col-auto">
							<p className="fr-mb-0 fr-text--sm">
								{company.gipWorkforce === null ? (
									GIP_WORKFORCE_ABSENT_DISPLAY
								) : (
									<>
										Effectif annuel moyen en {getWorkforceYear()} :{" "}
										<strong>{toDisplayWorkforce(company.gipWorkforce)}</strong>
									</>
								)}
							</p>
						</div>
						{cseApplicable && (
							<div className="fr-col-auto">
								<p className="fr-mb-0 fr-text--sm">
									Existence d'un CSE :{" "}
									<strong>
										{company.hasCse === null
											? "Non renseigné"
											: company.hasCse
												? "Oui"
												: "Non"}
									</strong>
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
			<div className="fr-container fr-py-7w">
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
			</div>
		</main>
	);
}

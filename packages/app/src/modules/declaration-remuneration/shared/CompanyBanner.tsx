import { getWorkforceYear } from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout";
import { formatSiren } from "~/modules/my-space";

import styles from "./CompanyBanner.module.scss";

type CompanyBannerProps = {
	company: {
		name: string;
		siren: string;
		workforce: number | null;
		hasCse: boolean | null;
	};
	currentPageLabel: string;
};

export function CompanyBanner({
	company,
	currentPageLabel,
}: CompanyBannerProps) {
	return (
		<div className={`fr-py-3w ${styles.banner}`}>
			<div className="fr-container">
				<Breadcrumb
					items={[
						{ label: "Mon espace", href: "/" },
						{ label: currentPageLabel },
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
					{company.workforce !== null && (
						<div className="fr-col-auto">
							<p className="fr-mb-0 fr-text--sm">
								Effectif annuel moyen en {getWorkforceYear()} :{" "}
								<strong>{company.workforce}</strong>
							</p>
						</div>
					)}
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
				</div>
			</div>
		</div>
	);
}

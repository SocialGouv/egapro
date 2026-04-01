import { Breadcrumb } from "~/modules/layout";
import { formatSiren } from "~/modules/my-space";

import styles from "./CseOpinionLayout.module.scss";

type CompanyData = {
	name: string;
	siren: string;
	workforce: number | null;
	hasCse: boolean | null;
};

type Props = {
	company: CompanyData;
	declarationYear: number;
	children: React.ReactNode;
};

export function CseOpinionLayout({
	company,
	declarationYear,
	children,
}: Props) {
	return (
		<>
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
								label: `Démarche des indicateurs de rémunération ${declarationYear + 1}`,
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
						{company.workforce !== null && (
							<div className="fr-col-auto">
								<p className="fr-mb-0 fr-text--sm">
									Effectif annuel moyen en {declarationYear - 1} :{" "}
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
			<main className="fr-container fr-py-7w" id="content">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-lg-8">{children}</div>
				</div>
			</main>
		</>
	);
}

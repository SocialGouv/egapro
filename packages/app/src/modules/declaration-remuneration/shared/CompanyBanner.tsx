import Link from "next/link";

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
	const currentYear = new Date().getFullYear();

	return (
		<div className={`fr-py-3w ${styles.banner}`}>
			<div className="fr-container">
				<nav aria-label="vous êtes ici :" className="fr-breadcrumb">
					<button
						aria-controls="breadcrumb-declaration"
						aria-expanded="false"
						className="fr-breadcrumb__button"
						type="button"
					>
						Voir le fil d'Ariane
					</button>
					<div className="fr-collapse" id="breadcrumb-declaration">
						<ol className="fr-breadcrumb__list">
							<li>
								<Link className="fr-breadcrumb__link" href="/">
									Mon espace
								</Link>
							</li>
							<li>
								<span aria-current="page" className="fr-breadcrumb__link">
									{currentPageLabel}
								</span>
							</li>
						</ol>
					</div>
				</nav>

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
								Effectif annuel moyen en {currentYear - 1} :{" "}
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

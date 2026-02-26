import Link from "next/link";

import styles from "./CompanyBanner.module.scss";

type CompanyBannerProps = {
	siren: string;
	currentPageLabel: string;
};

const FAKE_COMPANY_NAME = "Mon entreprise";
const FAKE_EFFECTIF = "45";
const FAKE_CSE = "Oui";

function formatSiren(siren: string): string {
	return `${siren.slice(0, 3)} ${siren.slice(3, 6)} ${siren.slice(6, 9)}`;
}

export function CompanyBanner({ siren, currentPageLabel }: CompanyBannerProps) {
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
							{FAKE_COMPANY_NAME} - {formatSiren(siren)}
						</p>
					</div>
					<div className="fr-col-auto">
						<p className="fr-mb-0 fr-text--sm">
							Effectif annuel moyen en {currentYear - 1} :{" "}
							<strong>{FAKE_EFFECTIF}</strong>
						</p>
					</div>
					<div className="fr-col-auto">
						<p className="fr-mb-0 fr-text--sm">
							Existence d'un CSE : <strong>{FAKE_CSE}</strong>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

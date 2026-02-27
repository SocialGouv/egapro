import Link from "next/link";

import styles from "./CompanyInfoBanner.module.scss";
import { StatusBadge } from "./StatusBadge";
import { formatSiren } from "./formatSiren";
import type { CompanyDetail } from "./types";

type Props = {
	company: CompanyDetail;
};

const BREADCRUMB_ID = "breadcrumb-company";

export function CompanyInfoBanner({ company }: Props) {
	const currentYear = new Date().getFullYear();

	return (
		<div className={`fr-py-4w ${styles.banner}`}>
			<div className="fr-container">
				<nav aria-label="vous êtes ici :" className="fr-breadcrumb">
					<button
						aria-controls={BREADCRUMB_ID}
						aria-expanded="false"
						className="fr-breadcrumb__button"
						type="button"
					>
						Voir le fil d'Ariane
					</button>
					<div className="fr-collapse" id={BREADCRUMB_ID}>
						<ol className="fr-breadcrumb__list">
							<li>
								<Link
									className="fr-breadcrumb__link"
									href="/mon-espace/mes-entreprises"
								>
									Mon espace
								</Link>
							</li>
							<li>
								<span aria-current="page" className="fr-breadcrumb__link">
									{company.name}
								</span>
							</li>
						</ol>
					</div>
				</nav>

				<div className="fr-mt-3w">
					<div className="fr-grid-row fr-grid-row--middle fr-mb-1w">
						<div className="fr-col">
							<h2 className="fr-mb-0">{company.name}</h2>
						</div>
					</div>

					<p className="fr-text--bold fr-mb-1w">{formatSiren(company.siren)}</p>

					{company.address && (
						<p className="fr-text--bold fr-mb-1w">{company.address}</p>
					)}

					<div className="fr-grid-row fr-grid-row--gutters fr-mt-1w">
						{company.nafCode && (
							<div className="fr-col-auto">
								<p className="fr-mb-0">
									Code NAF : <strong>{company.nafCode}</strong>
								</p>
							</div>
						)}
						{company.workforce !== null && (
							<div className="fr-col-auto">
								<p className="fr-mb-0">
									Effectif annuel moyen en {currentYear} :{" "}
									<strong>{company.workforce}</strong>
								</p>
							</div>
						)}
						<div className="fr-col-auto">
							<p className="fr-mb-0 fr-flex fr-flex--align-center">
								Existence d'un CSE :{" "}
								{company.hasCse !== null ? (
									<strong className="fr-ml-1v">
										{company.hasCse ? "Oui" : "Non"}
									</strong>
								) : (
									<span className="fr-ml-1v">
										<StatusBadge status="to_complete" />
									</span>
								)}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

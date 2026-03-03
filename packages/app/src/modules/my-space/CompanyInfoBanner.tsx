import { Breadcrumb } from "~/modules/layout";

import { MODAL_ID as COMPANY_EDIT_MODAL_ID } from "./CompanyEditModal";
import styles from "./CompanyInfoBanner.module.scss";
import { formatSiren } from "./formatSiren";
import { StatusBadge } from "./StatusBadge";
import type { CompanyDetail } from "./types";

type Props = {
	company: CompanyDetail;
};

export function CompanyInfoBanner({ company }: Props) {
	const currentYear = new Date().getFullYear();

	return (
		<div className={`fr-py-4w ${styles.banner}`}>
			<div className="fr-container">
				<Breadcrumb
					items={[
						{ label: "Mon espace", href: "/mon-espace/mes-entreprises" },
						{ label: company.name },
					]}
				/>

				<div className="fr-mt-3w">
					<div className="fr-grid-row fr-grid-row--middle fr-mb-1w">
						<div className="fr-col">
							<h2 className="fr-mb-0">{company.name}</h2>
						</div>
						<div className="fr-col-auto">
							<button
								aria-controls={COMPANY_EDIT_MODAL_ID}
								className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-edit-line fr-btn--icon-left"
								data-fr-opened="false"
								type="button"
							>
								Modifier
							</button>
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

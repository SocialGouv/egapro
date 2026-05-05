import { getCurrentYear } from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout";

import { MODAL_ID as COMPANY_EDIT_MODAL_ID } from "./CompanyEditModal";
import styles from "./CompanyInfoBanner.module.scss";
import { formatAddress } from "./formatAddress";
import { formatSiren } from "./formatSiren";
import { StatusBadge } from "./StatusBadge";
import type { CompanyDetail } from "./types";

type Props = {
	company: CompanyDetail;
};

export function CompanyInfoBanner({ company }: Props) {
	const currentYear = getCurrentYear();

	return (
		<div className={`fr-pt-3w fr-pb-4w ${styles.banner}`}>
			<div className="fr-container">
				<Breadcrumb
					items={[
						{ label: "Mon espace", href: "/mon-espace/mes-entreprises" },
						{ label: company.name },
					]}
				/>

				<div className="fr-grid-row fr-grid-row--middle fr-mb-1w">
					<div className="fr-col">
						<h2 className="fr-h4 fr-mb-0">{company.name}</h2>
					</div>
					<div className="fr-col-auto">
						<button
							aria-controls={COMPANY_EDIT_MODAL_ID}
							className="fr-btn fr-btn--tertiary-no-outline fr-icon-edit-line fr-btn--icon-left"
							data-fr-opened="false"
							type="button"
						>
							Modifier
						</button>
					</div>
				</div>

				<div className={`${styles.infoRow} fr-mb-1w`}>
					<p className={styles.datapoint}>
						SIREN : <strong>{formatSiren(company.siren)}</strong>
					</p>
					{company.address && (
						<p className={styles.datapoint}>
							Adresse : <strong>{formatAddress(company.address)}</strong>
						</p>
					)}
				</div>

				<div className={styles.infoRow}>
					{company.nafCode && (
						<p className={styles.datapoint}>
							Code NAF : <strong>{company.nafCode}</strong>
						</p>
					)}
					{company.workforce !== null && (
						<p className={styles.datapoint}>
							Effectif annuel moyen en {currentYear} :{" "}
							<strong>{company.workforce}</strong>
						</p>
					)}
					<p className={styles.datapoint}>
						Existence d'un CSE :{" "}
						{company.hasCse !== null ? (
							<strong>{company.hasCse ? "Oui" : "Non"}</strong>
						) : (
							<StatusBadge status="to_complete" />
						)}
					</p>
				</div>
			</div>
		</div>
	);
}

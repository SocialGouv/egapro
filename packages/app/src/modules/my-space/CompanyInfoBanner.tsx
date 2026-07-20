import {
	GIP_WORKFORCE_UNKNOWN_LABEL,
	getCurrentYear,
	getObligationWorkforce,
	isCseRequired,
	toDisplayWorkforce,
} from "~/modules/domain";
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
	const cseApplicable = isCseRequired(
		getObligationWorkforce(company.gipWorkforce),
	);

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
						<h1 className="fr-h4 fr-mb-0">{company.name}</h1>
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

				<dl className={`${styles.infoRow} fr-mb-1w`}>
					<div className={styles.datapoint}>
						<dt>SIREN :</dt>
						<dd>
							<strong>{formatSiren(company.siren)}</strong>
						</dd>
					</div>
					{company.address && (
						<div className={styles.datapoint}>
							<dt>Adresse :</dt>
							<dd>
								<strong>{formatAddress(company.address)}</strong>
							</dd>
						</div>
					)}
				</dl>

				<dl className={styles.infoRow}>
					{company.nafCode && (
						<div className={styles.datapoint}>
							<dt>Code NAF :</dt>
							<dd>
								<strong>
									{company.nafLabel
										? `${company.nafCode} — ${company.nafLabel}`
										: company.nafCode}
								</strong>
							</dd>
						</div>
					)}
					<div className={styles.datapoint}>
						<dt>Effectif annuel moyen en {currentYear} :</dt>
						<dd>
							{company.gipWorkforce === null ? (
								GIP_WORKFORCE_UNKNOWN_LABEL
							) : (
								<strong>{toDisplayWorkforce(company.gipWorkforce)}</strong>
							)}
						</dd>
					</div>
					{cseApplicable && (
						<div className={styles.datapoint}>
							<dt>Existence d'un CSE :</dt>
							<dd>
								{company.hasCse !== null ? (
									<strong>{company.hasCse ? "Oui" : "Non"}</strong>
								) : (
									<StatusBadge status="to_complete" />
								)}
							</dd>
						</div>
					)}
				</dl>
			</div>
		</div>
	);
}

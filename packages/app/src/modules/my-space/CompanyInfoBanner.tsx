import {
	formatWorkforceForUser,
	getObligationWorkforce,
	getWorkforceYear,
	isCseRequired,
} from "~/modules/domain";

import { MODAL_ID as COMPANY_EDIT_MODAL_ID } from "./CompanyEditModal";
import styles from "./CompanyInfoBanner.module.scss";
import { formatInseeTitleCase } from "./formatInseeTitleCase";
import { formatSiren } from "./formatSiren";
import { StatusBadge } from "./StatusBadge";
import type { CompanyDetail } from "./types";

type Props = {
	company: CompanyDetail;
};

type CountryDisplay =
	| { kind: "foreign"; label: string }
	| { kind: "unknown" }
	| { kind: "domestic" };

// countryCode alone can't tell France from unresolved (it's null for both) — countryLabel decides.
function resolveCountryDisplay(
	company: Pick<CompanyDetail, "countryCode" | "countryLabel">,
): CountryDisplay {
	if (company.countryCode !== null && company.countryLabel !== null) {
		return { kind: "foreign", label: company.countryLabel };
	}
	if (company.countryLabel === null) {
		return { kind: "unknown" };
	}
	return { kind: "domestic" };
}

export function CompanyInfoBanner({ company }: Props) {
	const workforceYear = getWorkforceYear();
	const obligationWorkforce = getObligationWorkforce(company.gipWorkforce);
	// The CSE field is the only editable datapoint and it starts at 100, so below
	// that threshold the modal has nothing to offer and the entry point is hidden.
	const cseApplicable = isCseRequired(obligationWorkforce);
	const countryDisplay = resolveCountryDisplay(company);
	const locationRow =
		countryDisplay.kind === "domestic" ? (
			company.address && (
				<div className={styles.datapoint}>
					<dt>Adresse :</dt>
					<dd>
						<strong>{formatInseeTitleCase(company.address)}</strong>
					</dd>
				</div>
			)
		) : (
			<div className={styles.datapoint}>
				<dt>Pays :</dt>
				<dd>
					<strong>
						{countryDisplay.kind === "foreign"
							? formatInseeTitleCase(countryDisplay.label)
							: "non renseigné"}
					</strong>
				</dd>
			</div>
		);

	return (
		<div className={`fr-pt-3w fr-pb-4w ${styles.banner}`}>
			<div className="fr-container">
				<div className="fr-grid-row fr-grid-row--middle fr-mb-1w">
					<div className="fr-col">
						<h1 className="fr-h4 fr-mb-0">{company.name}</h1>
					</div>
					{cseApplicable && (
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
					)}
				</div>

				<dl className={`${styles.infoRow} fr-mb-1w`}>
					<div className={styles.datapoint}>
						<dt>SIREN :</dt>
						<dd>
							<strong>{formatSiren(company.siren)}</strong>
						</dd>
					</div>
					{locationRow}
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
						<dt>Effectif annuel moyen en {workforceYear} :</dt>
						<dd>
							<strong>{formatWorkforceForUser(company.gipWorkforce)}</strong>
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

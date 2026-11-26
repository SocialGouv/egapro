import {
	type CompanySize,
	classifyCompanySize,
	companyLocationRow,
	formatInseeTitleCase,
	formatWorkforceForUser,
	getObligationWorkforce,
	getWorkforceYear,
	isCseRequired,
} from "~/modules/domain";
import { TooltipButton } from "~/modules/shared/TooltipButton";

import { MODAL_ID as COMPANY_EDIT_MODAL_ID } from "./CompanyEditModal";
import styles from "./CompanyInfoBanner.module.scss";
import { formatNafForDisplay } from "./formatNafForDisplay";
import { formatSiren } from "./formatSiren";
import { StatusBadge } from "./StatusBadge";
import type { CompanyDetail } from "./types";

type Props = {
	company: CompanyDetail;
};

const INFO_SOURCE_TOOLTIP_ID = "company-info-source-tooltip";
const INFO_SOURCE_LABEL = "Information sur la source des données";

const INFO_SOURCE_TEXT_BY_SIZE: Partial<Record<CompanySize, string>> = {
	voluntary: "Source : INSEE.",
	mandatory:
		"Source : INSEE et DSN (Déclarations Sociales Nominatives) pour l'effectif annuel moyen.",
};

export function CompanyInfoBanner({ company }: Props) {
	const workforceYear = getWorkforceYear();
	const obligationWorkforce = getObligationWorkforce(company.gipWorkforce);
	// The CSE field is the only editable datapoint and it starts at 100, so below
	// that threshold the modal has nothing to offer and the entry point is hidden.
	const cseApplicable = isCseRequired(obligationWorkforce);
	const companySize = classifyCompanySize(obligationWorkforce);
	const infoSourceText = INFO_SOURCE_TEXT_BY_SIZE[companySize];
	// An unresolved identity has no location at all: `companyLocationRow` would
	// fall back to "Pays : inconnu", which reads as a field rather than as an
	// absence on a cartouche that already explains the outage.
	const location = company.identityUnavailable
		? null
		: companyLocationRow({
				countryCode: company.countryCode,
				countryLabel: company.countryLabel,
				departmentLabel: company.departmentLabel,
				domesticAddress: company.address
					? formatInseeTitleCase(company.address)
					: null,
			});
	const title = company.identityUnavailable
		? `Entreprise ${formatSiren(company.siren)}`
		: company.name;

	return (
		<>
			{company.identityUnavailable && (
				<div className="fr-notice fr-notice--info">
					<div className="fr-container">
						<div className="fr-notice__body">
							<div>
								<p className="fr-notice__title">
									Les informations d'identification de l'entreprise sont
									temporairement indisponibles.
								</p>
								<p className="fr-notice__desc">
									Vous pouvez poursuivre votre démarche : ces informations
									s'afficheront dès le rétablissement du service.
								</p>
							</div>
						</div>
					</div>
				</div>
			)}
			<div className={`fr-pt-3w fr-pb-4w ${styles.banner}`}>
				<div className="fr-container">
					<div className="fr-grid-row fr-grid-row--middle fr-mb-1w">
						<div className={`fr-col ${styles.titleRow}`}>
							<h1 className={`fr-h4 fr-mb-0 ${styles.title}`}>{title}</h1>
							{infoSourceText && (
								<span className={styles.tooltipWrapper}>
									<TooltipButton
										id={INFO_SOURCE_TOOLTIP_ID}
										label={INFO_SOURCE_LABEL}
										text={infoSourceText}
									/>
								</span>
							)}
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

					<dl className={`${styles.infoRow} fr-mb-1w fr-text-title--grey`}>
						<div className={styles.datapoint}>
							<dt>SIREN :</dt>
							<dd>
								<strong>{formatSiren(company.siren)}</strong>
							</dd>
						</div>
						{location && (
							<div className={styles.datapoint}>
								<dt>{location.label} :</dt>
								<dd>
									<strong>{location.value}</strong>
								</dd>
							</div>
						)}
					</dl>

					<dl className={`${styles.infoRow} fr-text-title--grey`}>
						{company.nafCode && (
							<div className={styles.datapoint}>
								<dt>Code NAF :</dt>
								<dd>
									<strong>
										{formatNafForDisplay(company.nafCode, company.nafLabel)}
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
		</>
	);
}

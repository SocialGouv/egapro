import {
	GIP_WORKFORCE_ABSENT_DISPLAY,
	getObligationWorkforce,
	getWorkforceYear,
	isCseRequired,
	toDisplayWorkforce,
} from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout";
import { formatSiren } from "~/modules/my-space";

import styles from "./CompanyBanner.module.scss";

type CompanyBannerProps = {
	company: {
		name: string;
		siren: string;
		nafCode: string | null;
		nafLabel: string | null;
		gipWorkforce: number | null;
		hasCse: boolean | null;
	};
	currentPageLabel: string;
};

export function CompanyBanner({
	company,
	currentPageLabel,
}: CompanyBannerProps) {
	const cseApplicable = isCseRequired(
		getObligationWorkforce(company.gipWorkforce),
	);

	return (
		<div className={`fr-py-3w ${styles.banner}`}>
			<div className="fr-container">
				<Breadcrumb
					items={[
						{ label: "Mon espace", href: "/" },
						{ label: company.name },
						{ label: currentPageLabel },
					]}
				/>

				<div className={styles.companyRow}>
					<p className="fr-text--bold fr-mb-0">{company.name}</p>

					<div className={styles.datapoint}>
						<span>{"SIREN :"}</span>
						<strong>{formatSiren(company.siren)}</strong>
					</div>

					{company.nafCode && (
						<div className={styles.datapoint}>
							<span>{"Code NAF :"}</span>
							<strong>
								{company.nafLabel
									? `${company.nafCode} — ${company.nafLabel}`
									: company.nafCode}
							</strong>
						</div>
					)}

					<div className={styles.datapoint}>
						{company.gipWorkforce === null ? (
							<span>{GIP_WORKFORCE_ABSENT_DISPLAY}</span>
						) : (
							<>
								<span>
									{"Effectif annuel moyen en"} {getWorkforceYear()} {":"}
								</span>
								<strong>{toDisplayWorkforce(company.gipWorkforce)}</strong>
							</>
						)}
					</div>

					{cseApplicable && (
						<div className={styles.datapoint}>
							<span>{"Existence d'un CSE :"}</span>
							<strong>
								{company.hasCse === null
									? "Non renseigné"
									: company.hasCse
										? "Oui"
										: "Non"}
							</strong>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

import { getWorkforceYear } from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout";
import { formatSiren } from "~/modules/my-space";

import styles from "./CompanyBanner.module.scss";

type CompanyBannerProps = {
	company: {
		name: string;
		siren: string;
		nafCode: string | null;
		nafLabel: string | null;
		workforce: number | null;
		hasCse: boolean | null;
	};
	currentPageLabel: string;
};

export function CompanyBanner({
	company,
	currentPageLabel,
}: CompanyBannerProps) {
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

					{company.workforce !== null && (
						<div className={styles.datapoint}>
							<span>
								{"Effectif annuel moyen en"} {getWorkforceYear()} {":"}
							</span>
							<strong>{company.workforce}</strong>
						</div>
					)}

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
				</div>
			</div>
		</div>
	);
}

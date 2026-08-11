import {
	formatWorkforceDisplay,
	getObligationWorkforce,
	getWorkforceYear,
	isCseRequired,
} from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout";
import { formatSiren } from "~/modules/my-space";

import styles from "./CompanyBanner.module.scss";

type CompanyBannerProps = {
	company: {
		name: string;
		siren: string;
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

					<div className={styles.datapoint}>
						<span>
							{"Effectif annuel moyen en"} {getWorkforceYear()} {":"}
						</span>
						<strong>{formatWorkforceDisplay(company.gipWorkforce)}</strong>
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

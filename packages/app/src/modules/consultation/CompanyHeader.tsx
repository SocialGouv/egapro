import Link from "next/link";
import { getReferenceYearFor } from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout/Breadcrumb";
import styles from "./CompanyHeader.module.scss";
import { SEARCH_PATH } from "./constants";
import { formatCount } from "./formatters";

type Props = {
	name: string | null;
	siren: string;
	address: string | null;
	nafCode: string | null;
	nafLabel: string | null;
	workforceEma: number | null;
	year: number;
};

type Fact = { label: string; value: string };

export function CompanyHeader({
	name,
	siren,
	address,
	nafCode,
	nafLabel,
	workforceEma,
	year,
}: Props) {
	const displayName = name ?? `Entreprise ${siren}`;
	const identity: Fact[] = [{ label: "SIREN", value: siren }];
	if (address) identity.push({ label: "Adresse", value: address });

	const activity: Fact[] = [];
	if (nafCode || nafLabel) {
		activity.push({
			label: "Code NAF",
			value: [nafCode, nafLabel].filter(Boolean).join(" - "),
		});
	}
	if (workforceEma !== null) {
		activity.push({
			// The headcount reported for a campaign is the previous civil year's.
			label: `Effectif annuel moyen en ${getReferenceYearFor(year)}`,
			value: formatCount(workforceEma),
		});
	}

	return (
		<div className={`fr-background-alt--blue-france ${styles.band}`}>
			<div className="fr-container">
				<Breadcrumb
					items={[
						{ label: "Observatoire", href: SEARCH_PATH },
						{ label: displayName },
					]}
				/>
				<Link
					className={`fr-link fr-icon-arrow-left-line fr-link--icon-left ${styles.back}`}
					href={SEARCH_PATH}
				>
					Retour
				</Link>
				<h1 className={styles.name}>{displayName}</h1>
				{[identity, activity].map((facts, index) =>
					facts.length === 0 ? null : (
						<p
							className={styles.facts}
							key={facts[0]?.label ?? `facts-${index}`}
						>
							{facts.map((fact) => (
								<span className={styles.fact} key={fact.label}>
									{fact.label} :{" "}
									<span className={styles.value}>{fact.value}</span>
								</span>
							))}
						</p>
					),
				)}
			</div>
		</div>
	);
}

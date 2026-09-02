import Link from "next/link";
import { getReferenceYearFor } from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout/Breadcrumb";
import { NON_DIFFUSIBLE_LABEL } from "~/modules/public-api";
import styles from "./CompanyHeader.module.scss";
import { companyLocation, formatCount, formatNaf } from "./formatters";

type Props = {
	name: string | null;
	siren: string;
	address: string | null;
	region: string | null;
	departmentLabel: string | null;
	countryLabel: string | null;
	nafCode: string | null;
	nafLabel: string | null;
	workforceEma: number | null;
	year: number;
	backHref: string;
};

type Fact = { label: string; value: string };

export function CompanyHeader({
	name,
	siren,
	address,
	region,
	departmentLabel,
	countryLabel,
	nafCode,
	nafLabel,
	workforceEma,
	year,
	backHref,
}: Props) {
	const displayName = name ?? `Entreprise ${siren}`;
	const identity: Fact[] = [{ label: "SIREN", value: siren }];
	const location =
		address && address !== NON_DIFFUSIBLE_LABEL
			? { label: "Adresse", value: address }
			: address === NON_DIFFUSIBLE_LABEL
				? { label: "Adresse", value: NON_DIFFUSIBLE_LABEL }
				: companyLocation({ countryLabel, departmentLabel, region });
	if (location) identity.push(location);

	const activity: Fact[] = [];
	const publicNaf = formatNaf(nafCode, nafLabel);
	const naf =
		publicNaf === NON_DIFFUSIBLE_LABEL
			? NON_DIFFUSIBLE_LABEL
			: [nafCode, nafLabel].filter(Boolean).join(" - ");
	if (naf) {
		activity.push({
			label: "Code NAF",
			value: naf,
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
						{ label: "Observatoire", href: backHref },
						{ label: displayName },
					]}
				/>
				<Link
					className={`fr-link fr-icon-arrow-left-line fr-link--icon-left ${styles.back}`}
					href={backHref}
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

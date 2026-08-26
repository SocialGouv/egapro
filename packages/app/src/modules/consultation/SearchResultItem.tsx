import Link from "next/link";
import { formatObservatoryWorkforce } from "~/modules/domain";
import type { PublicDeclarationDTO } from "~/modules/public-api";
import styles from "./SearchResultItem.module.scss";

type Props = { declaration: PublicDeclarationDTO };

type Fact = { label: string; value: string };

function buildFacts(declaration: PublicDeclarationDTO): Fact[] {
	const facts: Fact[] = [{ label: "SIREN", value: declaration.siren }];

	// A company registered abroad has no French département to show, so the card
	// names the country instead of leaving the location line half empty.
	if (declaration.countryLabel) {
		facts.push({ label: "Pays", value: declaration.countryLabel });
	} else {
		const location = [declaration.departmentLabel, declaration.region]
			.filter(Boolean)
			.join(", ");
		if (location) facts.push({ label: "Adresse", value: location });
	}

	if (declaration.nafCode || declaration.nafLabel) {
		facts.push({
			label: "Code NAF",
			value: declaration.nafLabel
				? `${declaration.nafLabel}${declaration.nafCode ? ` (${declaration.nafCode})` : ""}`
				: (declaration.nafCode ?? ""),
		});
	}

	const workforce = formatObservatoryWorkforce(declaration.workforceEma);
	if (workforce) facts.push({ label: "Effectif", value: workforce });

	return facts;
}

export function SearchResultItem({ declaration }: Props) {
	const facts = buildFacts(declaration);
	return (
		<article className={styles.item}>
			<h3 className={styles.title}>
				<Link
					className={`fr-link ${styles.link}`}
					href={`/index-egapro/entreprise/${declaration.siren}`}
				>
					{declaration.name ?? "Entreprise"}
				</Link>
			</h3>
			<p className={styles.facts}>
				{facts.map((fact) => (
					<span className={styles.fact} key={fact.label}>
						{fact.label} : <span className={styles.value}>{fact.value}</span>
					</span>
				))}
			</p>
		</article>
	);
}

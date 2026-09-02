import Link from "next/link";
import { formatObservatoryWorkforce } from "~/modules/domain";
import type { PublicDeclarationDTO } from "~/modules/public-api";
import { companyLocation, formatNaf } from "./formatters";
import styles from "./SearchResultItem.module.scss";

type Props = { declaration: PublicDeclarationDTO; searchQuery: string };

type Fact = { label: string; value: string };

function buildFacts(declaration: PublicDeclarationDTO): Fact[] {
	const facts: Fact[] = [{ label: "SIREN", value: declaration.siren }];

	const location = companyLocation(declaration);
	if (location) facts.push(location);

	const naf = formatNaf(declaration.nafCode, declaration.nafLabel);
	if (naf) {
		facts.push({
			label: "Code NAF",
			value: naf,
		});
	}

	const workforce = formatObservatoryWorkforce(declaration.workforceEma);
	if (workforce) facts.push({ label: "Effectif", value: workforce });

	return facts;
}

export function SearchResultItem({ declaration, searchQuery }: Props) {
	const facts = buildFacts(declaration);
	return (
		<article className={styles.item}>
			<h3 className={styles.title}>
				<Link
					className={`fr-link ${styles.link}`}
					href={`/index-egapro/entreprise/${declaration.siren}${searchQuery ? `?from=${encodeURIComponent(searchQuery)}` : ""}`}
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

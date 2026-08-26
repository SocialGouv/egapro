import Link from "next/link";
import type { PublicDeclarationDTO } from "~/modules/public-api";
import styles from "./SearchResultItem.module.scss";

type Props = { declaration: PublicDeclarationDTO };

export function SearchResultItem({ declaration }: Props) {
	const location = declaration.countryLabel
		? declaration.countryLabel
		: [
				declaration.city,
				declaration.departmentCode,
				declaration.departmentLabel,
			]
				.filter(Boolean)
				.join(" — ");
	return (
		<article className={styles.item}>
			<h2 className="fr-h4 fr-mb-1w">
				<Link href={`/index-egapro/entreprise/${declaration.siren}`}>
					{declaration.name ?? "Entreprise"}
				</Link>
			</h2>
			<p className={styles.details}>
				<span>SIREN {declaration.siren}</span>
				<span>Dernier résultat publié : {declaration.year}</span>
				{location && <span>{location}</span>}
				{declaration.nafCode && <span>NAF {declaration.nafCode}</span>}
				{declaration.workforceEma !== null && (
					<span>
						{Math.round(declaration.workforceEma).toLocaleString("fr-FR")}{" "}
						salariés
					</span>
				)}
			</p>
		</article>
	);
}

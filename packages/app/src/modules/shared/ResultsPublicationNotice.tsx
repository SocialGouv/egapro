import Link from "next/link";
import { OBSERVATORY_SEARCH } from "~/modules/routes";

type Props = {
	companyName: string;
};

export function ResultsPublicationNotice({ companyName }: Props) {
	return (
		<div>
			<h2 className="fr-h5 fr-mb-3w">Publication des résultats</h2>
			<div className="fr-highlight">
				<p className="fr-text--sm fr-mb-1w">
					Les résultats déclarés par {companyName} seront rendus publics dans
					l&apos;onglet « Observatoire » d&apos;Egapro, à l&apos;exception de
					l&apos;indicateur concernant les écarts de rémunération par catégorie
					d&apos;emplois.
				</p>
				<Link className="fr-btn fr-btn--tertiary" href={OBSERVATORY_SEARCH}>
					Consulter l&apos;observatoire
				</Link>
			</div>
		</div>
	);
}

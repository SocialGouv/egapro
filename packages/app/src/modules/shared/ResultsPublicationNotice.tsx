import Link from "next/link";
import { OBSERVATORY_SEARCH } from "~/modules/routes";

export const REMUNERATION_PUBLICATION_EXCEPTION =
	"l'indicateur concernant les écarts de rémunération par catégorie d'emplois";

type Props = {
	companyName: string;
	excludedResults?: string;
};

export function ResultsPublicationNotice({
	companyName,
	excludedResults,
}: Props) {
	return (
		<div>
			<h2 className="fr-h5 fr-mb-3w">Publication des résultats</h2>
			<div className="fr-highlight">
				<p className="fr-text--sm fr-mb-1w">
					Les résultats déclarés par {companyName} seront rendus publics dans
					l&apos;onglet « Observatoire » d&apos;Egapro
					{excludedResults ? (
						<>, à l&apos;exception de {excludedResults}</>
					) : null}
					.
				</p>
				<Link className="fr-btn fr-btn--tertiary" href={OBSERVATORY_SEARCH}>
					Consulter l&apos;observatoire
				</Link>
			</div>
		</div>
	);
}

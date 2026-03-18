import { NewTabNotice } from "~/modules/layout";

/** Textes de référence section with external legislation links. */
export function AideTextesReference() {
	return (
		<div className="fr-callout fr-callout--blue-france">
			<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
				<div className="fr-col-auto">
					<span
						aria-hidden="true"
						className="fr-icon-file-text-line fr-icon--lg"
					/>
				</div>
				<div className="fr-col">
					<h2 className="fr-callout__title">Textes de référence</h2>
					<p className="fr-callout__text">
						Consultez les textes législatifs et réglementaires
					</p>
					<ul className="fr-links-group">
						{[
							{
								href: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037396684",
								label: "Article L. 1142-8 du Code du travail",
							},
							{
								href: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000038234561",
								label: "Décret n° 2019-15 du 8 janvier 2019",
							},
						].map(({ href, label }) => (
							<li key={href}>
								<a
									className="fr-link fr-icon-external-link-line fr-link--icon-right"
									href={href}
									rel="noopener noreferrer"
									target="_blank"
								>
									{label}
									<NewTabNotice />
								</a>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}

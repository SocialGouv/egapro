import type { FaqSection } from "./types";

type Props = {
	sections: FaqSection[];
};

/** DSFR Sommaire component with anchor links to each FAQ section. */
export function FaqSummary({ sections }: Props) {
	return (
		<nav aria-labelledby="fr-summary-title" className="fr-summary">
			<h2 className="fr-summary__title" id="fr-summary-title">
				Sommaire
			</h2>
			<ol>
				{sections.map((section) => (
					<li key={section.id}>
						<a className="fr-summary__link" href={`#${section.id}`}>
							{section.title}
						</a>
					</li>
				))}
			</ol>
		</nav>
	);
}

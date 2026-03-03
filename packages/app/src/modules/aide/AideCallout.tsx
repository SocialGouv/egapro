import { DECLARATION_DEADLINE, DECLARATION_YEAR } from "./constants";

/** Callout displaying the declaration deadline. */
export function AideCallout() {
	return (
		<div className="fr-callout fr-icon-information-line fr-callout--orange-terre-battue">
			<h2 className="fr-callout__title">Date limite de déclaration</h2>
			<p className="fr-callout__text">
				La date limite de déclaration pour l'année {DECLARATION_YEAR} est fixée
				au <strong>{DECLARATION_DEADLINE}</strong>.
			</p>
		</div>
	);
}

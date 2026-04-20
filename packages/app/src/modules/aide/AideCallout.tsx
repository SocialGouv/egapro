import { formatLongDate } from "~/modules/domain";

type Props = {
	year: number;
	deadline: Date;
};

/** Callout displaying the declaration deadline for the active campaign year. */
export function AideCallout({ year, deadline }: Props) {
	return (
		<div className="fr-callout fr-callout--orange-terre-battue">
			<h2 className="fr-callout__title">Date limite de déclaration</h2>
			<p className="fr-callout__text">
				La date limite de déclaration pour l'année {year} est fixée au{" "}
				<strong>{formatLongDate(deadline)}</strong>.
			</p>
		</div>
	);
}

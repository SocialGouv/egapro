import { formatLongDate } from "~/modules/domain";
import styles from "./AideCallout.module.scss";

type Props = {
	year: number;
	deadline: Date;
};

/** Callout displaying the declaration deadline for the active campaign year. */
export function AideCallout({ year, deadline }: Props) {
	return (
		<div
			className={`fr-callout fr-callout--orange-terre-battue ${styles.callout}`}
		>
			<h2 className="fr-callout__title">Date limite de déclaration</h2>
			<p className="fr-callout__text">
				La date limite de déclaration pour l'année {year} est fixée au{" "}
				<strong>{formatLongDate(deadline)}</strong>.
			</p>
		</div>
	);
}

import styles from "~/modules/declaration-remuneration/shared/InterpretationCallout.module.scss";
import type { QuartileData } from "~/modules/declaration-remuneration/types";
import { computePercentage } from "~/modules/domain";

type Props = {
	annualCategories: QuartileData[];
	hourlyCategories: QuartileData[];
};

/** Returns true when the highest quartile is significantly skewed toward one sex. */
export function hasHighQuartileImbalance(
	annualCategories: QuartileData[],
	hourlyCategories: QuartileData[],
): boolean {
	const annualQ4 = annualCategories[3];
	const hourlyQ4 = hourlyCategories[3];
	if (!annualQ4 || !hourlyQ4) return false;
	const annualTotal = (annualQ4.women ?? 0) + (annualQ4.men ?? 0);
	const hourlyTotal = (hourlyQ4.women ?? 0) + (hourlyQ4.men ?? 0);
	if (annualTotal === 0 && hourlyTotal === 0) return false;
	const annualRatio =
		annualTotal > 0 ? (annualQ4.women ?? 0) / annualTotal : 0.5;
	const hourlyRatio =
		hourlyTotal > 0 ? (hourlyQ4.women ?? 0) / hourlyTotal : 0.5;
	const avg = (annualRatio + hourlyRatio) / 2;
	return avg < 0.4 || avg > 0.6;
}

/**
 * Interpretation callout for Step 4 quartile distribution.
 * Analyzes the proportion of women in the highest quartile (4th)
 * and generates an interpretation of the results.
 */
export function QuartileInterpretationCallout({
	annualCategories,
	hourlyCategories,
}: Props) {
	const annualQ4 = annualCategories[3];
	const hourlyQ4 = hourlyCategories[3];
	if (!annualQ4 || !hourlyQ4) return null;

	const annualQ4Women = annualQ4.women ?? 0;
	const annualQ4Men = annualQ4.men ?? 0;
	const annualQ4Total = annualQ4Women + annualQ4Men;

	const hourlyQ4Women = hourlyQ4.women ?? 0;
	const hourlyQ4Men = hourlyQ4.men ?? 0;
	const hourlyQ4Total = hourlyQ4Women + hourlyQ4Men;

	if (annualQ4Total === 0 && hourlyQ4Total === 0) return null;

	const annualWomenPct = computePercentage(annualQ4Women, annualQ4Total);
	const hourlyWomenPct = computePercentage(hourlyQ4Women, hourlyQ4Total);

	// Determine if women are underrepresented in the highest quartile (< 40%)
	const annualWomenRatio =
		annualQ4Total > 0 ? annualQ4Women / annualQ4Total : 0.5;
	const hourlyWomenRatio =
		hourlyQ4Total > 0 ? hourlyQ4Women / hourlyQ4Total : 0.5;
	const avgRatio = (annualWomenRatio + hourlyWomenRatio) / 2;

	const isWomenUnderrepresented = avgRatio < 0.4;
	const isMenUnderrepresented = avgRatio > 0.6;
	const isBalanced = !isWomenUnderrepresented && !isMenUnderrepresented;

	const accentClass = isBalanced
		? "fr-callout--blue-ecume"
		: "fr-callout--orange-terre-battue";

	let title: string;
	let body: string;
	let interpretation: string;

	if (isWomenUnderrepresented) {
		title = "Écart en défaveur des femmes";
		body = `les femmes sont nettement moins présentes dans le quartile des plus hauts salaires (${annualWomenPct} en annuel et ${hourlyWomenPct} en horaire), alors qu'elles sont proches de la parité dans les autres quartiles.`;
		interpretation =
			"les femmes accèdent moins aux postes les mieux rémunérés, ce qui indique une inégalité d'accès aux niveaux de salaire les plus élevés.";
	} else if (isMenUnderrepresented) {
		const annualMenPct =
			annualQ4Total > 0 ? computePercentage(annualQ4Men, annualQ4Total) : "-";
		const hourlyMenPct =
			hourlyQ4Total > 0 ? computePercentage(hourlyQ4Men, hourlyQ4Total) : "-";
		title = "Écart en défaveur des hommes";
		body = `les hommes sont nettement moins présents dans le quartile des plus hauts salaires (${annualMenPct} en annuel et ${hourlyMenPct} en horaire), alors qu'ils sont proches de la parité dans les autres quartiles.`;
		interpretation =
			"les hommes accèdent moins aux postes les mieux rémunérés, ce qui met en évidence une inégalité d'accès aux niveaux de salaire les plus élevés.";
	} else {
		title = "Écart entre hommes et femmes";
		body =
			"la répartition des femmes et des hommes au sein des différents quartiles de rémunération est globalement équilibrée.";
		interpretation =
			"ces résultats traduisent une répartition relativement homogène des niveaux de rémunération et ne révèlent pas d'inégalité significative d'accès aux niveaux de salaire les plus élevés.";
	}

	return (
		<div className={`fr-callout ${accentClass} ${styles.callout}`}>
			<p className="fr-callout__text fr-mb-2w">
				<strong>{title}&nbsp;:</strong> {body}
			</p>
			<p className="fr-callout__text">
				<strong>Interprétation des résultats&nbsp;:</strong> {interpretation}
			</p>
		</div>
	);
}

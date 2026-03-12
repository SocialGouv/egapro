import { computePercentage } from "~/modules/declaration-remuneration/shared/gapUtils";
import styles from "~/modules/declaration-remuneration/shared/InterpretationCallout.module.scss";
import type { StepCategoryData } from "~/modules/declaration-remuneration/types";

type Props = {
	annualCategories: StepCategoryData[];
	hourlyCategories: StepCategoryData[];
};

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

	const annualQ4Women = annualQ4.womenCount ?? 0;
	const annualQ4Men = annualQ4.menCount ?? 0;
	const annualQ4Total = annualQ4Women + annualQ4Men;

	const hourlyQ4Women = hourlyQ4.womenCount ?? 0;
	const hourlyQ4Men = hourlyQ4.menCount ?? 0;
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
		body = `Les femmes sont nettement moins présentes dans le quartile des plus hauts salaires (${annualWomenPct} en annuel et ${hourlyWomenPct} en horaire), alors qu'elles sont proches de la parité dans les autres quartiles.`;
		interpretation =
			"les femmes accèdent moins aux postes les mieux rémunérés, ce qui indique une inégalité d'accès aux niveaux de salaire les plus élevés.";
	} else if (isMenUnderrepresented) {
		title = "Écart en défaveur des hommes";
		body = `Les hommes sont nettement moins présents dans le quartile des plus hauts salaires (${annualQ4Total > 0 ? computePercentage(annualQ4Men, annualQ4Total) : "-"} en annuel et ${hourlyQ4Total > 0 ? computePercentage(hourlyQ4Men, hourlyQ4Total) : "-"} en horaire).`;
		interpretation =
			"les hommes accèdent moins aux postes les mieux rémunérés, ce qui indique une inégalité d'accès aux niveaux de salaire les plus élevés.";
	} else {
		title = "Équilibre entre hommes et femmes";
		body = `La répartition entre femmes et hommes est relativement équilibrée dans le quartile des plus hauts salaires (${annualWomenPct} de femmes en annuel et ${hourlyWomenPct} en horaire).`;
		interpretation =
			"Les écarts de répartition sont faibles et ne révèlent pas d'inégalité significative dans l'accès aux niveaux de salaire les plus élevés.";
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

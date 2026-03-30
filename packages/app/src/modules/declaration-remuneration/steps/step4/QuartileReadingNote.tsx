import type { QuartileData } from "~/modules/declaration-remuneration/types";
import { computePercentage } from "~/modules/domain";

type Props = {
	categories: QuartileData[];
	tableType: "annual" | "hourly";
	year: number;
};

/**
 * "Note de lecture" paragraph displayed above each quartile table in prefilled mode.
 * Annual: uses first quartile data (Q1 = "un salarié sur quatre").
 * Hourly: uses median data (Q2 = "un salarié sur deux").
 */
export function QuartileReadingNote({ categories, tableType, year }: Props) {
	// Annual uses Q1 (index 0), hourly uses Q2/median (index 1)
	const isAnnual = tableType === "annual";
	const quartile = isAnnual ? categories[0] : categories[1];
	if (!quartile) return null;

	const threshold = quartile.threshold;
	const womenCount = quartile.women ?? 0;
	const menCount = quartile.men ?? 0;
	const total = womenCount + menCount;

	if (!threshold || total === 0) return null;

	const thresholdFormatted = Number.parseFloat(threshold).toLocaleString(
		"fr-FR",
		{
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		},
	);

	const typeLabel = isAnnual
		? "rémunération annuelle brute moyenne"
		: "rémunération horaire brute moyenne";

	const quantifier = isAnnual ? "quatre" : "deux";
	const quartileLabel = isAnnual ? (
		<>
			(1<sup>er</sup> quartile)
		</>
	) : (
		"(médiane)"
	);

	const womenPct = computePercentage(womenCount, total);
	const menPct = computePercentage(menCount, total);

	return (
		<p className="fr-mb-0">
			Note de lecture&nbsp;: En {year}, un salarié sur {quantifier} a perçu une{" "}
			{typeLabel} inférieure à {thresholdFormatted}&nbsp;€ {quartileLabel}, ce
			qui concerne {total} salariés dont {womenCount} femmes, soit {womenPct} et{" "}
			{menCount} hommes, soit {menPct}.
		</p>
	);
}

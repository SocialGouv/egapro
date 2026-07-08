import type { ReactNode } from "react";
import {
	computeGap,
	computeProportion,
	formatGapCompact,
	GAP_ALERT_THRESHOLD,
} from "~/modules/domain";
import type { PayGapRow } from "../types";
import styles from "./InterpretationCallout.module.scss";

/** Gap magnitude (null-safe): the informative callout describes size + both directions, not the sign. */
const magnitude = (g: number | null): number | null =>
	g === null ? null : Math.abs(g);

/** Returns true when at least one row crosses the regulatory gap threshold (either direction). */
export function hasHighPayGap(rows: PayGapRow[]): boolean {
	return rows.some((r) => {
		const gap = magnitude(computeGap(r.womenValue, r.menValue));
		return gap !== null && gap >= GAP_ALERT_THRESHOLD;
	});
}

type GapDirection = "women" | "men" | "balanced";

type GapAnalysis = {
	direction: GapDirection;
	annualMeanGap: number | null;
	annualMedianGap: number | null;
	hourlyMeanGap: number | null;
	hourlyMedianGap: number | null;
	hasHighGap: boolean;
};

function analyzeGaps(rows: PayGapRow[]): GapAnalysis {
	const findRow = (label: string) => rows.find((r) => r.label === label);
	const annualMean = findRow("Annuelle brute moyenne");
	const annualMedian = findRow("Annuelle brute médiane");
	const hourlyMean = findRow("Horaire brute moyenne");
	const hourlyMedian = findRow("Horaire brute médiane");

	const annualMeanGap = annualMean
		? magnitude(computeGap(annualMean.womenValue, annualMean.menValue))
		: null;
	const annualMedianGap = annualMedian
		? magnitude(computeGap(annualMedian.womenValue, annualMedian.menValue))
		: null;
	const hourlyMeanGap = hourlyMean
		? magnitude(computeGap(hourlyMean.womenValue, hourlyMean.menValue))
		: null;
	const hourlyMedianGap = hourlyMedian
		? magnitude(computeGap(hourlyMedian.womenValue, hourlyMedian.menValue))
		: null;

	const gaps = [annualMeanGap, annualMedianGap, hourlyMeanGap, hourlyMedianGap];
	const hasHighGap = gaps.some((g) => g !== null && g >= GAP_ALERT_THRESHOLD);

	// When no gap reaches the regulatory threshold, treat the situation as
	// balanced — sub-threshold deltas are not interpreted as disfavor.
	let direction: GapDirection = "balanced";
	if (hasHighGap) {
		let womenLowerCount = 0;
		let menLowerCount = 0;
		for (const row of rows) {
			const w = Number.parseFloat(row.womenValue);
			const m = Number.parseFloat(row.menValue);
			if (Number.isNaN(w) || Number.isNaN(m)) continue;
			if (w < m) womenLowerCount++;
			if (m < w) menLowerCount++;
		}
		if (womenLowerCount > menLowerCount) direction = "women";
		else if (menLowerCount > womenLowerCount) direction = "men";
	}

	return {
		direction,
		annualMeanGap,
		annualMedianGap,
		hourlyMeanGap,
		hourlyMedianGap,
		hasHighGap,
	};
}

/** Format gap as bold percentage */
function boldGap(g: number | null): ReactNode {
	if (g === null) return "-";
	return <strong>{formatGapCompact(g)} %</strong>;
}

function buildPayGapBody(analysis: GapAnalysis): {
	title: string;
	body: ReactNode;
	interpretation: string;
} {
	const { direction, annualMeanGap, annualMedianGap, hourlyMeanGap } = analysis;
	const isHourlyHigher =
		hourlyMeanGap !== null &&
		annualMeanGap !== null &&
		hourlyMeanGap > annualMeanGap;

	if (direction === "women") {
		return {
			title: "Écart en défaveur des femmes",
			body: (
				<>
					Les femmes perçoivent en moyenne une rémunération annuelle brute
					inférieure à celle de {boldGap(annualMeanGap)} à celui des hommes, et
					une rémunération médiane inférieure de {boldGap(annualMedianGap)}. Les
					écarts horaires sont {isHourlyHigher ? "plus élevés" : "comparables"},
					autour de {boldGap(hourlyMeanGap)}.
				</>
			),
			interpretation: isHourlyHigher
				? "L'écart horaire est plus important que l'écart annuel, ce qui peut s'expliquer par des différences dans le volume d'heures travaillées."
				: "Les écarts annuels et horaires sont cohérents, ce qui suggère une différence structurelle de rémunération.",
		};
	}

	if (direction === "men") {
		return {
			title: "Écart en défaveur des hommes",
			body: (
				<>
					Les hommes perçoivent en moyenne une rémunération annuelle brute
					inférieure à celle de {boldGap(annualMeanGap)} à celui des femmes, et
					une rémunération médiane inférieure de {boldGap(annualMedianGap)}. Les
					écarts horaires sont {isHourlyHigher ? "plus élevés" : "comparables"},
					autour de {boldGap(hourlyMeanGap)}.
				</>
			),
			interpretation: isHourlyHigher
				? "L'écart horaire est plus important que l'écart annuel, ce qui peut s'expliquer par des différences dans le volume d'heures travaillées."
				: "Les écarts annuels et horaires sont cohérents, ce qui suggère une différence structurelle de rémunération.",
		};
	}

	return {
		title: "Écart entre hommes et femmes",
		body: "Les rémunérations annuelles et médianes sont très proches, avec des écarts inférieurs à 5 %. Les différences horaires sont également limitées.",
		interpretation:
			"Les écarts sont faibles et ne révèlent pas d'inégalité significative.",
	};
}

function buildVariablePayBody(
	analysis: GapAnalysis,
	beneficiaryWomen?: string,
	beneficiaryMen?: string,
	maxWomen?: number,
	maxMen?: number,
): {
	title: string;
	body: ReactNode;
	interpretation: string;
} {
	const { direction, hourlyMeanGap, hourlyMedianGap } = analysis;
	const fmtGap = (g: number | null) =>
		g !== null ? `${formatGapCompact(g)} %` : "-";

	const womenPct = computeProportion(beneficiaryWomen ?? "", maxWomen);
	const menPct = computeProportion(beneficiaryMen ?? "", maxMen);

	if (direction === "women") {
		return {
			title: "Écart en défaveur des femmes",
			body: (
				<>
					les écarts sont très importants sur les rémunérations variables
					horaires ({fmtGap(hourlyMeanGap)} en moyenne et{" "}
					{fmtGap(hourlyMedianGap)} en médiane), tandis que les écarts annuels
					restent faibles, dans un contexte où seules{" "}
					<strong>{womenPct}</strong> des femmes en bénéficient contre{" "}
					<strong>{menPct}</strong> des hommes.
				</>
			),
			interpretation:
				"les femmes accèdent moins souvent aux rémunérations variables et perçoivent des montants horaires inférieurs.",
		};
	}

	if (direction === "men") {
		return {
			title: "Écart en défaveur des hommes",
			body: (
				<>
					les écarts sont très importants sur les rémunérations variables
					horaires en défaveur des hommes ({fmtGap(hourlyMeanGap)} en moyenne et{" "}
					{fmtGap(hourlyMedianGap)} en médiane en faveur des femmes), tandis que
					les écarts annuels restent faibles, dans un contexte où{" "}
					<strong>{womenPct}</strong> des femmes en bénéficient contre{" "}
					<strong>{menPct}</strong> des hommes.
				</>
			),
			interpretation:
				"Les hommes accèdent moins souvent aux rémunérations variables et perçoivent des montants horaires inférieurs à ceux des femmes.",
		};
	}

	return {
		title: "Écart entre hommes et femmes",
		body: "Les écarts de rémunération variable observés, en moyenne et en médiane, ne révèlent pas de différence significative entre les femmes et les hommes.",
		interpretation:
			"Les niveaux de rémunération sont globalement équivalents et ne traduisent pas de déséquilibre notable.",
	};
}

type Props = {
	rows: PayGapRow[];
	variant?: "payGap" | "variablePay";
	beneficiaryWomen?: string;
	beneficiaryMen?: string;
	maxWomen?: number;
	maxMen?: number;
};

export function GapInterpretationCallout({
	rows,
	variant = "payGap",
	beneficiaryWomen,
	beneficiaryMen,
	maxWomen,
	maxMen,
}: Props) {
	const analysis = analyzeGaps(rows);
	const hasData = rows.some((r) => r.womenValue && r.menValue);
	if (!hasData) return null;

	const { title, body, interpretation } =
		variant === "variablePay"
			? buildVariablePayBody(
					analysis,
					beneficiaryWomen,
					beneficiaryMen,
					maxWomen,
					maxMen,
				)
			: buildPayGapBody(analysis);

	const accentClass = analysis.hasHighGap
		? "fr-callout--orange-terre-battue"
		: "fr-callout--blue-ecume";

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

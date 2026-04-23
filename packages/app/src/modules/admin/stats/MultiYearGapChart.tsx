"use client";

import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { formatGap } from "~/modules/domain";

import styles from "./MultiYearGapChart.module.scss";
import type { MultiYearGapTrendSeries } from "./types";

type Props = {
	series: MultiYearGapTrendSeries[];
	/**
	 * Names of the series currently hidden by the toggle checkboxes. The chart
	 * still plots its X-axis but does not render the corresponding `<Line>`.
	 */
	hiddenSegments: ReadonlySet<string>;
};

type TooltipEntry = {
	name?: string | number;
	value?: number;
	color?: string;
};

type TrendTooltipProps = {
	active?: boolean;
	payload?: TooltipEntry[];
	label?: string | number;
	sampleSizes: Record<string, Record<number, number>>;
};

type MergedPoint = {
	year: number;
	[segment: string]: number | null;
};

/**
 * DSFR color cycle — one per series, taken from design-system tokens so the
 * tiles, badges and the chart stay visually consistent. The order is
 * deterministic so the same segment keeps the same color across re-renders.
 */
const SERIES_COLORS = [
	"var(--background-action-high-blue-france)",
	"var(--background-action-high-green-bourgeon)",
	"var(--background-action-high-orange-terre-battue)",
	"var(--background-action-high-purple-glycine)",
	"var(--background-action-high-pink-tuile)",
	"var(--text-mention-grey)",
];

export function colorForSegment(index: number): string {
	return SERIES_COLORS[index % SERIES_COLORS.length] ?? SERIES_COLORS[0] ?? "";
}

/**
 * Interleave all series into a single row-per-year dataset so Recharts can
 * plot one line per segment on a shared year axis. Missing points stay null.
 */
function mergeSeries(series: MultiYearGapTrendSeries[]): MergedPoint[] {
	const byYear = new Map<number, MergedPoint>();
	for (const { segment, points } of series) {
		for (const { year, avgGap } of points) {
			const existing = byYear.get(year) ?? { year };
			existing[segment] = avgGap;
			byYear.set(year, existing);
		}
	}
	return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}

function TrendTooltip({
	active,
	payload,
	label,
	sampleSizes,
}: TrendTooltipProps) {
	if (
		!active ||
		!payload ||
		payload.length === 0 ||
		typeof label !== "number"
	) {
		return null;
	}
	return (
		<div className="fr-p-2w fr-background-alt--grey">
			<p className="fr-text--sm fr-text--bold fr-mb-1w">Année {label}</p>
			<ul className={styles.tooltipList}>
				{payload.map((entry) => {
					if (entry.value == null) return null;
					const segment = String(entry.name ?? "");
					const size = sampleSizes[segment]?.[label] ?? 0;
					return (
						<li className={styles.tooltipItem} key={segment}>
							{segment} : écart moyen {formatGap(entry.value)} (sur{" "}
							{size.toLocaleString("fr-FR")} déclarations)
						</li>
					);
				})}
			</ul>
		</div>
	);
}

export function MultiYearGapChart({ series, hiddenSegments }: Props) {
	const data = mergeSeries(series);

	if (data.length === 0) {
		return (
			<p aria-live="polite" className="fr-text--sm fr-text-mention--grey">
				Aucune donnée pour ces filtres.
			</p>
		);
	}

	const sampleSizes: Record<string, Record<number, number>> = {};
	for (const { segment, points } of series) {
		sampleSizes[segment] = {};
		for (const { year, sampleSize } of points) {
			const current = sampleSizes[segment];
			if (current) current[year] = sampleSize;
		}
	}

	const visibleSeries = series.filter((s) => !hiddenSegments.has(s.segment));

	return (
		<figure className={styles.chartWrapper}>
			<figcaption className="fr-sr-only">
				Courbe d'évolution annuelle de l'écart moyen de rémunération. Les
				données équivalentes sont disponibles dans le tableau ci-dessous.
			</figcaption>
			<ResponsiveContainer>
				<LineChart data={data}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						allowDecimals={false}
						dataKey="year"
						tickFormatter={(value: number) => String(value)}
					/>
					<YAxis tickFormatter={(value: number) => `${value.toFixed(1)} %`} />
					<Tooltip content={<TrendTooltip sampleSizes={sampleSizes} />} />
					{visibleSeries.map(({ segment }) => {
						const originalIndex = series.findIndex(
							(s) => s.segment === segment,
						);
						return (
							<Line
								connectNulls
								dataKey={segment}
								dot
								key={segment}
								name={segment}
								stroke={colorForSegment(originalIndex)}
								strokeWidth={2}
								type="monotone"
							/>
						);
					})}
				</LineChart>
			</ResponsiveContainer>
		</figure>
	);
}

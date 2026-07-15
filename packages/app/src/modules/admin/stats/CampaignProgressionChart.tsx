"use client";

import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { formatMonthDay, percentageOf } from "~/modules/domain";

import styles from "./CampaignProgressionChart.module.scss";
import { formatCount } from "./formatters";
import type { CampaignProgressionSeries } from "./types";

type TooltipEntry = {
	name?: string | number;
	value?: number;
	color?: string;
};

type ProgressionTooltipProps = {
	active?: boolean;
	payload?: TooltipEntry[];
	label?: string | number;
	totals: Record<number, number>;
};

type Props = {
	series: CampaignProgressionSeries[];
	/** Identifies the current campaign year (drawn with the emphasis color). */
	currentYear: number;
};

type MergedPoint = {
	/** `MM-DD` for the X axis — shared across years. */
	dayOfYear: string;
} & {
	[year: number]: number | null;
};

const CHART_CAPTION =
	"Courbe de progression cumulative des déclarations soumises par année.";

// DSFR palette — pulled from design system tokens, not guessed.
const EMPHASIS_COLOR = "var(--background-action-high-blue-france)";
const N_MINUS_1_COLOR = "var(--text-mention-grey)";
const N_MINUS_2_COLOR = "var(--text-disabled-grey)";

function dayOfYear(iso: string): string {
	return iso.slice(5); // `2026-02-15` -> `02-15`
}

function colorForYear(year: number, currentYear: number): string {
	if (year === currentYear) return EMPHASIS_COLOR;
	if (year === currentYear - 1) return N_MINUS_1_COLOR;
	return N_MINUS_2_COLOR;
}

/**
 * Interleave all series into a single row-per-day dataset so Recharts can
 * plot one line per year on a shared `MM-DD` axis.
 */
function mergeSeries(series: CampaignProgressionSeries[]): MergedPoint[] {
	const byDay = new Map<string, MergedPoint>();

	for (const { year, points } of series) {
		for (const { day, cumulative } of points) {
			const key = dayOfYear(day);
			const existing = byDay.get(key) ?? { dayOfYear: key };
			existing[year] = cumulative;
			byDay.set(key, existing);
		}
	}

	return Array.from(byDay.values()).sort((a, b) =>
		a.dayOfYear.localeCompare(b.dayOfYear),
	);
}

function ProgressionTooltip({
	active,
	payload,
	label,
	totals,
}: ProgressionTooltipProps) {
	if (
		!active ||
		!payload ||
		payload.length === 0 ||
		typeof label !== "string"
	) {
		return null;
	}
	return (
		<div className="fr-p-2w fr-background-alt--grey">
			<p className="fr-text--sm fr-text--bold fr-mb-1w">
				{formatMonthDay(label)}
			</p>
			<ul className={styles.tooltipList}>
				{payload.map((entry) => {
					if (entry.value == null) return null;
					const year = Number(entry.name);
					const total = totals[year] ?? 0;
					const pct = Math.round(percentageOf(entry.value, total));
					return (
						<li className={styles.tooltipItem} key={entry.name}>
							{year} : {formatCount(entry.value)} déclarations ({pct} % du
							total)
						</li>
					);
				})}
			</ul>
		</div>
	);
}

export function CampaignProgressionChart({ series, currentYear }: Props) {
	const data = mergeSeries(series);
	const totals = Object.fromEntries(
		series.map(({ year, points }) => [
			year,
			points[points.length - 1]?.cumulative ?? 0,
		]),
	) as Record<number, number>;

	if (data.length === 0) {
		return (
			<p aria-live="polite" className="fr-text--sm fr-text-mention--grey">
				Aucune donnée pour ces filtres.
			</p>
		);
	}

	return (
		<figure className={styles.chartWrapper}>
			<figcaption className="fr-sr-only">
				{CHART_CAPTION} Les données équivalentes sont disponibles dans le
				tableau ci-dessous.
			</figcaption>
			<div
				aria-label={CHART_CAPTION}
				className={styles.chartContainer}
				role="img"
			>
				<ResponsiveContainer>
					<LineChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis
							dataKey="dayOfYear"
							interval={6}
							tickFormatter={(value: string) => formatMonthDay(value)}
						/>
						<YAxis tickFormatter={(value: number) => formatCount(value)} />
						<Tooltip content={<ProgressionTooltip totals={totals} />} />
						<Legend />
						{series.map(({ year }) => (
							<Line
								connectNulls
								dataKey={year}
								dot={false}
								key={year}
								name={String(year)}
								stroke={colorForYear(year, currentYear)}
								strokeWidth={year === currentYear ? 3 : 2}
								type="monotone"
							/>
						))}
					</LineChart>
				</ResponsiveContainer>
			</div>
		</figure>
	);
}

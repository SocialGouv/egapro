"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import {
	formatCount,
	formatRate,
	NARROW_NBSP,
	type ScoreBracketId,
} from "~/modules/domain";

import styles from "./ScoreDistributionChart.module.scss";

export type ScoreDistributionBracket = {
	id: ScoreBracketId;
	label: string;
	count: number;
	percentage: number;
};

type Props = {
	brackets: ScoreDistributionBracket[];
};

const BRACKET_COLOR: Record<ScoreBracketId, string> = {
	lt50: "var(--background-action-high-error)",
	"50-59": "var(--background-action-high-warning)",
	"60-69": "var(--background-action-high-yellow-tournesol)",
	"70-79": "var(--background-action-high-green-emeraude)",
	"80-89": "var(--background-action-high-green-bourgeon)",
	"90-99": "var(--background-action-high-green-tilleul-verveine)",
	"100": "var(--background-action-high-success)",
	nc: "var(--background-alt-grey)",
};

type TooltipPayloadEntry = {
	payload?: ScoreDistributionBracket;
};

type ChartTooltipProps = {
	active?: boolean;
	payload?: TooltipPayloadEntry[];
};

export function formatYAxisTick(value: number): string {
	return formatCount(value);
}

export function ChartTooltip({ active, payload }: ChartTooltipProps) {
	if (!active || !payload || payload.length === 0) return null;
	const datum = payload[0]?.payload;
	if (!datum) return null;
	const noun = datum.count > 1 ? "entreprises" : "entreprise";
	return (
		<div className="fr-p-2w fr-background-alt--grey">
			<p className="fr-text--sm fr-mb-0">
				<strong>
					{formatCount(datum.count)} {noun}
				</strong>{" "}
				— tranche {datum.label} ({formatRate(datum.percentage)}
				{NARROW_NBSP}% du total)
			</p>
		</div>
	);
}

export function ScoreDistributionChart({ brackets }: Props) {
	return (
		<div aria-hidden="true" className={styles.chartWrapper}>
			<ResponsiveContainer>
				<BarChart
					accessibilityLayer={false}
					data={brackets}
					margin={{ top: 16, right: 16, bottom: 8 }}
				>
					<CartesianGrid strokeDasharray="3 3" vertical={false} />
					<XAxis dataKey="label" />
					<YAxis tickFormatter={formatYAxisTick} />
					<Tooltip content={<ChartTooltip />} cursor={false} />
					<Bar dataKey="count" isAnimationActive={false}>
						{brackets.map((bracket) => (
							<Cell fill={BRACKET_COLOR[bracket.id]} key={bracket.id} />
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

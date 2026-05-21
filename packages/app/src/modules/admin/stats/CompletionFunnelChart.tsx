"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	LabelList,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import styles from "./CompletionFunnelChart.module.scss";
import type { FunnelRow } from "./types";

type Props = {
	caption: string;
	rows: FunnelRow[];
	dropThreshold: number;
};

type TooltipEntry = {
	payload?: FunnelRow;
};

type FunnelTooltipProps = {
	active?: boolean;
	payload?: TooltipEntry[];
};

const DEFAULT_BAR_COLOR = "var(--background-action-high-blue-france)";
const ALERT_BAR_COLOR = "var(--background-action-high-red-marianne)";

function formatCount(value: number): string {
	return value.toLocaleString("fr-FR");
}

function isAboveThreshold(
	pctDropFromPrev: number | null,
	threshold: number,
): boolean {
	return pctDropFromPrev !== null && pctDropFromPrev > threshold;
}

function FunnelTooltip({ active, payload }: FunnelTooltipProps) {
	if (!active || !payload || payload.length === 0) return null;
	const row = payload[0]?.payload;
	if (!row) return null;
	return (
		<div className="fr-p-2w fr-background-alt--grey">
			<p className="fr-text--sm fr-text--bold fr-mb-1w">« {row.label} »</p>
			<ul className={styles.tooltipList}>
				<li className={styles.tooltipItem}>
					{formatCount(row.count)} déclarations ({row.pctOfStart} % du funnel)
				</li>
				{row.pctDropFromPrev !== null && (
					<li className={styles.tooltipItem}>
						Chute de {row.pctDropFromPrev} % vs étape précédente
					</li>
				)}
			</ul>
		</div>
	);
}

type ChartRow = FunnelRow & { displayLabel: string };

export function CompletionFunnelChart({ caption, rows, dropThreshold }: Props) {
	const hasData = rows.some((row) => row.count > 0);

	if (!hasData) {
		return (
			<p
				aria-live="polite"
				className="fr-text--sm fr-text-mention--grey fr-mt-2w"
			>
				Aucune donnée pour ces filtres.
			</p>
		);
	}

	const chartRows: ChartRow[] = rows.map((row) => ({
		...row,
		displayLabel: `${formatCount(row.count)} (${row.pctOfStart} %)`,
	}));

	return (
		<figure className={styles.chartWrapper}>
			<figcaption className="fr-sr-only">
				{caption}. Nombre de déclarations à chaque jalon du funnel, avec le
				pourcentage du funnel et la chute par rapport à l'étape précédente. Les
				données équivalentes sont disponibles dans le tableau ci-dessous.
			</figcaption>
			<ResponsiveContainer>
				<BarChart
					data={chartRows}
					layout="vertical"
					margin={{ top: 16, right: 96, bottom: 16, left: 16 }}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						label={{
							value: "Déclarations",
							position: "insideBottom",
							offset: -4,
						}}
						tickFormatter={(value: number) => value.toLocaleString("fr-FR")}
						type="number"
					/>
					<YAxis dataKey="label" interval={0} type="category" width={220} />
					<Tooltip content={<FunnelTooltip />} />
					<Bar dataKey="count" fill={DEFAULT_BAR_COLOR} name="Déclarations">
						{chartRows.map((row) => (
							<Cell
								fill={
									isAboveThreshold(row.pctDropFromPrev, dropThreshold)
										? ALERT_BAR_COLOR
										: DEFAULT_BAR_COLOR
								}
								key={row.key}
							/>
						))}
						<LabelList dataKey="displayLabel" position="right" />
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</figure>
	);
}

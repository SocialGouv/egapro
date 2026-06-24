"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import styles from "./StatsBarChart.module.scss";

export type BarSeries<Row> = {
	key: Extract<keyof Row, string>;
	name: string;
	// DSFR CSS custom property, e.g. "var(--blue-france-sun-113-625)".
	color: string;
};

type Props<Row extends { label: string }> = {
	caption: string;
	data: Row[];
	series: BarSeries<Row>[];
	valueAxisLabel: string;
	emptyLabel?: string;
};

/**
 * Generic horizontal bar chart for the Matomo behavioural-usage widgets. One
 * `<Bar>` per series (single series for model usage / help links, three for the
 * device split). Mirrors the accessibility contract of the other stats charts:
 * `<figure>` + sr-only `<figcaption>` + `role="img"` wrapper, with the
 * equivalent data exposed in a sibling `<StatsBarTable>`.
 */
export function StatsBarChart<Row extends { label: string }>({
	caption,
	data,
	series,
	valueAxisLabel,
	emptyLabel = "Aucune donnée pour ces filtres.",
}: Props<Row>) {
	const hasData = data.some((row) =>
		series.some((serie) => Number(row[serie.key] ?? 0) > 0),
	);
	if (!hasData) {
		return (
			<p aria-live="polite" className="fr-text--sm fr-text-mention--grey">
				{emptyLabel}
			</p>
		);
	}

	return (
		<figure className={styles.chartWrapper}>
			<figcaption className="fr-sr-only">
				{caption}. Les données équivalentes sont disponibles dans le tableau
				ci-dessous.
			</figcaption>
			<div aria-label={caption} className={styles.chartContainer} role="img">
				<ResponsiveContainer>
					<BarChart
						data={data}
						layout="vertical"
						margin={{ top: 16, right: 32, bottom: 24, left: 8 }}
					>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis
							allowDecimals={false}
							label={{
								value: valueAxisLabel,
								position: "insideBottom",
								offset: -8,
							}}
							type="number"
						/>
						<YAxis
							dataKey="label"
							interval={0}
							tick={{ fontSize: 12 }}
							type="category"
							width={260}
						/>
						<Tooltip />
						{series.length > 1 && <Legend />}
						{series.map((serie) => (
							<Bar
								dataKey={serie.key}
								fill={serie.color}
								key={serie.key}
								name={serie.name}
							/>
						))}
					</BarChart>
				</ResponsiveContainer>
			</div>
		</figure>
	);
}

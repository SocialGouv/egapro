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

import styles from "./StepDurationsChart.module.scss";
import type { StepDurationRow } from "./types";

type Props = {
	rows: StepDurationRow[];
};

type TooltipEntry = {
	name?: string | number;
	value?: number;
	color?: string;
	payload?: StepDurationRow;
};

type DurationsTooltipProps = {
	active?: boolean;
	payload?: TooltipEntry[];
};

const MEDIAN_COLOR = "var(--background-action-high-blue-france)";
const P90_COLOR = "var(--background-action-low-blue-france)";

function formatDays(value: number | null): string {
	if (value === null) return "—";
	return `${value.toLocaleString("fr-FR", {
		maximumFractionDigits: 1,
		minimumFractionDigits: 1,
	})} j`;
}

function DurationsTooltip({ active, payload }: DurationsTooltipProps) {
	if (!active || !payload || payload.length === 0) {
		return null;
	}
	const row = payload[0]?.payload;
	if (!row) return null;
	return (
		<div className="fr-p-2w fr-background-alt--grey">
			<p className="fr-text--sm fr-text--bold fr-mb-1w">
				Étape « {row.label} »
			</p>
			<ul className={styles.tooltipList}>
				<li className={styles.tooltipItem}>
					médiane {formatDays(row.medianDays)} — p90 {formatDays(row.p90Days)}
				</li>
				<li className={styles.tooltipItem}>
					sur {row.sampleSize.toLocaleString("fr-FR")} déclarations passées par
					cette étape
				</li>
			</ul>
		</div>
	);
}

export function StepDurationsChart({ rows }: Props) {
	const hasAnyDuration = rows.some(
		(row) => row.medianDays !== null || row.p90Days !== null,
	);

	if (!hasAnyDuration) {
		return (
			<p aria-live="polite" className="fr-text--sm fr-text-mention--grey">
				Aucune donnée pour ces filtres.
			</p>
		);
	}

	return (
		<figure className={styles.chartWrapper}>
			<figcaption className="fr-sr-only">
				Délai médian et 90e percentile passé par les déclarations sur chaque
				étape du parcours indicateurs. Les données équivalentes sont disponibles
				dans le tableau ci-dessous.
			</figcaption>
			<ResponsiveContainer>
				<BarChart
					data={rows}
					layout="vertical"
					margin={{ top: 16, right: 24, bottom: 16, left: 16 }}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						label={{
							value: "Jours",
							position: "insideBottom",
							offset: -4,
						}}
						tickFormatter={(value: number) => value.toLocaleString("fr-FR")}
						type="number"
					/>
					<YAxis dataKey="label" interval={0} type="category" width={180} />
					<Tooltip content={<DurationsTooltip />} />
					<Legend />
					<Bar dataKey="medianDays" fill={MEDIAN_COLOR} name="Médiane (j)" />
					<Bar dataKey="p90Days" fill={P90_COLOR} name="p90 (j)" />
				</BarChart>
			</ResponsiveContainer>
		</figure>
	);
}

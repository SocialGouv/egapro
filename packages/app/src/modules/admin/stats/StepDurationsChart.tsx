"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { formatCount, formatDays } from "./formatters";
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

// Distinct DSFR palettes per phase — the colour break makes the wizard /
// post-submit handoff readable without referencing the labels.
const WIZARD_MEDIAN_COLOR = "var(--background-action-high-blue-france)";
const WIZARD_P90_COLOR = "var(--background-action-low-blue-france)";
const POST_SUBMIT_MEDIAN_COLOR = "var(--background-action-high-red-marianne)";
const POST_SUBMIT_P90_COLOR = "var(--background-action-low-red-marianne)";

function DurationsTooltip({ active, payload }: DurationsTooltipProps) {
	if (!active || !payload || payload.length === 0) {
		return null;
	}
	const row = payload[0]?.payload;
	if (!row) return null;
	const isWizard = row.phase === "wizard";
	return (
		<div className="fr-p-2w fr-background-alt--grey">
			<p className="fr-text--sm fr-text--bold fr-mb-1w">
				{isWizard ? "Étape" : "Jalon"} « {row.label} »
			</p>
			<ul className={styles.tooltipList}>
				<li className={styles.tooltipItem}>
					médiane {formatDays(row.medianDays, { withUnit: true })} — p90{" "}
					{formatDays(row.p90Days, { withUnit: true })}
				</li>
				<li className={styles.tooltipItem}>
					sur {formatCount(row.sampleSize)}{" "}
					{isWizard
						? "déclarations passées par cette étape"
						: "déclarations concernées par ce jalon"}
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
				étape du parcours indicateurs puis sur chaque jalon de la démarche
				post-soumission. Les données équivalentes sont disponibles dans le
				tableau ci-dessous.
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
						tickFormatter={(value: number) => formatCount(value)}
						type="number"
					/>
					<YAxis dataKey="label" interval={0} type="category" width={220} />
					<Tooltip content={<DurationsTooltip />} />
					<Legend />
					<Bar
						dataKey="medianDays"
						fill={WIZARD_MEDIAN_COLOR}
						name="Médiane (j)"
					>
						{rows.map((row) => (
							<Cell
								fill={
									row.phase === "wizard"
										? WIZARD_MEDIAN_COLOR
										: POST_SUBMIT_MEDIAN_COLOR
								}
								key={row.key}
							/>
						))}
					</Bar>
					<Bar dataKey="p90Days" fill={WIZARD_P90_COLOR} name="p90 (j)">
						{rows.map((row) => (
							<Cell
								fill={
									row.phase === "wizard"
										? WIZARD_P90_COLOR
										: POST_SUBMIT_P90_COLOR
								}
								key={row.key}
							/>
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</figure>
	);
}

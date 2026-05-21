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

import { DROPOFF_RATE_ALERT_THRESHOLD } from "~/modules/domain";

import styles from "./StepDropoffChart.module.scss";
import type { StepDropoffRow } from "./types";

type Props = {
	rows: StepDropoffRow[];
};

type TooltipEntry = {
	name?: string | number;
	value?: number;
	color?: string;
	payload?: StepDropoffRow;
};

type DropoffTooltipProps = {
	active?: boolean;
	payload?: TooltipEntry[];
};

const NORMAL_COLOR = "var(--background-action-high-blue-france)";
const ALERT_COLOR = "var(--background-action-high-red-marianne)";

function formatPercent(value: number): string {
	return `${value.toLocaleString("fr-FR", {
		maximumFractionDigits: 1,
		minimumFractionDigits: 1,
	})} %`;
}

function formatCount(value: number): string {
	return value.toLocaleString("fr-FR");
}

function DropoffTooltip({ active, payload }: DropoffTooltipProps) {
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
					{formatPercent(row.dropoffRate)} d'abandon
				</li>
				<li className={styles.tooltipItem}>
					{formatCount(row.abandoned)} sur {formatCount(row.total)} entreprises
					entrées sur l'étape
				</li>
			</ul>
		</div>
	);
}

export function StepDropoffChart({ rows }: Props) {
	const hasAnyData = rows.some((row) => row.total > 0);

	if (!hasAnyData) {
		return (
			<p aria-live="polite" className="fr-text--sm fr-text-mention--grey">
				Aucune donnée pour ces filtres.
			</p>
		);
	}

	return (
		<figure className={styles.chartWrapper}>
			<figcaption className="fr-sr-only">
				Taux d'abandon par étape du parcours indicateurs : pourcentage de
				déclarations entrées sur chaque étape et qui n'ont pas progressé depuis
				le délai sélectionné. Les barres rouges signalent une étape dont le taux
				dépasse {DROPOFF_RATE_ALERT_THRESHOLD} %. Les données équivalentes sont
				disponibles dans le tableau ci-dessous.
			</figcaption>
			<ResponsiveContainer>
				<BarChart
					data={rows}
					margin={{ top: 16, right: 24, bottom: 24, left: 16 }}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						dataKey="label"
						interval={0}
						label={{ value: "Étape", position: "insideBottom", offset: -16 }}
						tick={{ fontSize: 12 }}
					/>
					<YAxis
						domain={[0, 100]}
						label={{
							value: "Taux d'abandon (%)",
							angle: -90,
							position: "insideLeft",
						}}
						tickFormatter={(value: number) => `${value}`}
						type="number"
					/>
					<Tooltip content={<DropoffTooltip />} />
					<Bar dataKey="dropoffRate" fill={NORMAL_COLOR} name="Taux d'abandon">
						{rows.map((row) => (
							<Cell
								fill={
									row.dropoffRate > DROPOFF_RATE_ALERT_THRESHOLD
										? ALERT_COLOR
										: NORMAL_COLOR
								}
								key={`step_${row.step}`}
							/>
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</figure>
	);
}

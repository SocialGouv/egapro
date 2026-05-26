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

const WIZARD_NORMAL_COLOR = "var(--background-action-high-blue-france)";
const WIZARD_ALERT_COLOR = "var(--background-action-high-red-marianne)";
const POST_SUBMIT_NORMAL_COLOR = "var(--background-action-low-blue-france)";
const POST_SUBMIT_ALERT_COLOR = "var(--background-action-low-red-marianne)";

function getBarColor(row: StepDropoffRow): string {
	const isAlert = row.dropoffRate > DROPOFF_RATE_ALERT_THRESHOLD;
	if (row.phase === "wizard") {
		return isAlert ? WIZARD_ALERT_COLOR : WIZARD_NORMAL_COLOR;
	}
	return isAlert ? POST_SUBMIT_ALERT_COLOR : POST_SUBMIT_NORMAL_COLOR;
}

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
	const isWizard = row.phase === "wizard";
	return (
		<div className="fr-p-2w fr-background-alt--grey">
			<p className="fr-text--sm fr-text--bold fr-mb-1w">
				{isWizard ? "Étape" : "Phase"} « {row.label} »
			</p>
			<ul className={styles.tooltipList}>
				<li className={styles.tooltipItem}>
					{formatPercent(row.dropoffRate)} d'abandon
				</li>
				<li className={styles.tooltipItem}>
					{formatCount(row.abandoned)} sur {formatCount(row.total)} déclarations{" "}
					{isWizard ? "entrées sur l'étape" : "entrées dans la phase"}
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
				Taux d'abandon par phase de la démarche déclarative : pourcentage de
				déclarations entrées sur chaque étape du wizard ou phase post-soumission
				et qui n'ont pas progressé depuis le délai sélectionné. Les barres
				rouges signalent une phase dont le taux dépasse{" "}
				{DROPOFF_RATE_ALERT_THRESHOLD} %. Les données équivalentes sont
				disponibles dans le tableau ci-dessous.
			</figcaption>
			<ResponsiveContainer>
				<BarChart
					data={rows}
					layout="vertical"
					margin={{ top: 16, right: 32, bottom: 24, left: 8 }}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						domain={[0, 100]}
						label={{
							value: "Taux d'abandon (%)",
							position: "insideBottom",
							offset: -8,
						}}
						tickFormatter={(value: number) => `${value}`}
						type="number"
					/>
					<YAxis
						dataKey="label"
						interval={0}
						tick={{ fontSize: 12 }}
						type="category"
						width={260}
					/>
					<Tooltip content={<DropoffTooltip />} />
					<Bar
						dataKey="dropoffRate"
						fill={WIZARD_NORMAL_COLOR}
						name="Taux d'abandon"
					>
						{rows.map((row) => (
							<Cell fill={getBarColor(row)} key={row.key} />
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</figure>
	);
}

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
import {
	DROPOFF_RATE_ALERT_THRESHOLD,
	formatCount,
	formatFixedPercentage,
	isDropoffRateAboveThreshold,
} from "~/modules/domain";
import {
	DROPOFF_ALERT_MARK,
	DROPOFF_BAR_TONES,
	DROPOFF_THRESHOLD_COLUMN_LABEL,
} from "./constants";
import styles from "./StepDropoffChart.module.scss";
import { StepDropoffLegend } from "./StepDropoffLegend";
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

const CHART_CAPTION = `Taux d'abandon par phase de la démarche déclarative : pourcentage de déclarations entrées sur chaque étape du wizard ou phase post-transmission et qui n'ont pas progressé depuis le délai sélectionné. Les barres rouges, précédées du symbole ${DROPOFF_ALERT_MARK}, signalent une phase dont le taux dépasse ${DROPOFF_RATE_ALERT_THRESHOLD} % ; le tableau ci-dessous les repère dans sa colonne « ${DROPOFF_THRESHOLD_COLUMN_LABEL} ».`;

function getBarColor(row: StepDropoffRow): string {
	const tones = DROPOFF_BAR_TONES[row.phase];
	return isDropoffRateAboveThreshold(row.dropoffRate)
		? tones.alert.color
		: tones.normal.color;
}

function formatBarLabel(value: unknown): string {
	if (typeof value !== "number") return "";
	const rate = formatFixedPercentage(value, { withUnit: true });
	return isDropoffRateAboveThreshold(value)
		? `${DROPOFF_ALERT_MARK} ${rate}`
		: rate;
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
					{formatFixedPercentage(row.dropoffRate, { withUnit: true })} d'abandon
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
	const figureCaption = `${CHART_CAPTION} Les données équivalentes sont disponibles dans le tableau ci-dessous.`;

	return (
		// biome-ignore lint/a11y/useSemanticElements: RGAA 1.9.1 requires an explicit figure/group role
		<figure
			aria-label={figureCaption}
			className={styles.chartWrapper}
			role="group"
		>
			<figcaption className="fr-sr-only">{figureCaption}</figcaption>
			<div
				aria-label={CHART_CAPTION}
				className={styles.chartContainer}
				role="img"
			>
				<ResponsiveContainer>
					<BarChart
						accessibilityLayer={false}
						data={rows}
						layout="vertical"
						margin={{ top: 16, right: 80, bottom: 24, left: 8 }}
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
							fill={DROPOFF_BAR_TONES.wizard.normal.color}
							name="Taux d'abandon"
						>
							{rows.map((row) => (
								<Cell fill={getBarColor(row)} key={row.key} />
							))}
							<LabelList
								dataKey="dropoffRate"
								fill="var(--text-default-grey)"
								fontSize={12}
								formatter={formatBarLabel}
								position="right"
							/>
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>
			<StepDropoffLegend />
		</figure>
	);
}

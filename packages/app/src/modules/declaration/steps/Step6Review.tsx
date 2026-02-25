"use client";

import { FormActions } from "../shared/FormActions";
import { StepIndicator } from "../shared/StepIndicator";
import { TooltipButton } from "../shared/TooltipButton";
import type {
	PayGapRow,
	StepCategoryData,
	VariablePayData,
} from "../types";

// -- Helpers --

function computeGap(womenVal: string, menVal: string): number | null {
	const w = Number.parseFloat(womenVal);
	const m = Number.parseFloat(menVal);
	if (Number.isNaN(w) || Number.isNaN(m) || m === 0) return null;
	return ((m - w) / m) * 100;
}

function formatGap(gap: number | null): string {
	if (gap === null) return "-";
	return `${gap.toFixed(1).replace(".", ",")} %`;
}

function gapLevel(gap: number): "faible" | "élevé" {
	return Math.abs(gap) < 5 ? "faible" : "élevé";
}

function gapBadgeClass(level: "faible" | "élevé"): string {
	return level === "faible"
		? "fr-badge fr-badge--sm fr-badge--no-icon fr-badge--info"
		: "fr-badge fr-badge--sm fr-badge--no-icon fr-badge--warning";
}

// -- Styles --

const cardStyle: React.CSSProperties = {
	border: "1px solid var(--border-default-grey)",
	borderRadius: "4px",
	background: "var(--background-default-grey)",
	padding: "1.5rem",
	display: "flex",
	flexDirection: "column",
	gap: "1rem",
};

const sideBySideStyle: React.CSSProperties = {
	display: "flex",
	gap: "1.5rem",
	alignItems: "stretch",
};

const columnStyle: React.CSSProperties = {
	flex: 1,
	display: "flex",
	flexDirection: "column",
	gap: "0.5rem",
};

const verticalSeparatorStyle: React.CSSProperties = {
	width: "1px",
	background: "var(--border-default-grey)",
	alignSelf: "stretch",
};

// -- Sub-components --

function GapBadge({ gap }: { gap: number | null }) {
	if (gap === null) return <span>-</span>;
	const level = gapLevel(gap);
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: "0.5rem",
			}}
		>
			<strong>{formatGap(gap)}</strong>
			<span className={gapBadgeClass(level)}>{level}</span>
		</span>
	);
}

/** Card title with check icon and optional tooltip */
function CardTitle({
	children,
	tooltipId,
}: {
	children: React.ReactNode;
	tooltipId?: string;
}) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
			}}
		>
			<span
				className="fr-icon-check-line"
				aria-hidden="true"
				style={{
					color: "var(--background-flat-success)",
					fontSize: "1.25rem",
					flexShrink: 0,
				}}
			/>
			<p className="fr-text--bold fr-text--lg fr-mb-0">{children}</p>
			{tooltipId && (
				<TooltipButton id={tooltipId} label="Aide" />
			)}
		</div>
	);
}

/** Column within a side-by-side section: header row + value row */
function GapColumn({
	title,
	columns,
}: {
	title: string;
	columns: Array<{ label: string; gap: number | null }>;
}) {
	return (
		<div style={columnStyle}>
			<p className="fr-text--bold fr-text--sm fr-mb-0">{title}</p>
			<div style={{ display: "flex", gap: "1.5rem" }}>
				{columns.map((col) => (
					<div key={col.label} style={{ flex: 1 }}>
						<p
							className="fr-text--xs fr-mb-0"
							style={{ color: "var(--text-mention-grey)" }}
						>
							{col.label}
						</p>
						<GapBadge gap={col.gap} />
					</div>
				))}
			</div>
		</div>
	);
}

/** Quartile column: title, then quartile names as columns with percentages below */
function QuartileColumn({
	title,
	quartiles,
}: {
	title: string;
	quartiles: Array<{ label: string; womenCount: number; menCount: number }>;
}) {
	return (
		<div style={columnStyle}>
			<p className="fr-text--bold fr-text--sm fr-mb-0">{title}</p>

			<p
				className="fr-text--xs fr-mb-0"
				style={{ color: "var(--text-mention-grey)" }}
			>
				Pourcentage de femmes
			</p>
			<div style={{ display: "flex", gap: "1.5rem" }}>
				{quartiles.map((q) => {
					const total = q.womenCount + q.menCount || 1;
					const pct = ((q.womenCount / total) * 100).toFixed(1);
					return (
						<div key={`f-${q.label}`} style={{ flex: 1 }}>
							<p
								className="fr-text--xs fr-mb-0"
								style={{ color: "var(--text-mention-grey)" }}
							>
								{q.label}
							</p>
							<strong>{pct} %</strong>
						</div>
					);
				})}
			</div>

			<p
				className="fr-text--xs fr-mb-0 fr-mt-1w"
				style={{ color: "var(--text-mention-grey)" }}
			>
				Pourcentage d&apos;hommes
			</p>
			<div style={{ display: "flex", gap: "1.5rem" }}>
				{quartiles.map((q) => {
					const total = q.womenCount + q.menCount || 1;
					const pct = ((q.menCount / total) * 100).toFixed(1);
					return (
						<div key={`m-${q.label}`} style={{ flex: 1 }}>
							<p
								className="fr-text--xs fr-mb-0"
								style={{ color: "var(--text-mention-grey)" }}
							>
								{q.label}
							</p>
							<strong>{pct} %</strong>
						</div>
					);
				})}
			</div>
		</div>
	);
}

/** Side-by-side layout: Annuelle brute | separator | Horaire brute */
function GapSideBySide({
	annualMeanGap,
	annualMedianGap,
	hourlyMeanGap,
	hourlyMedianGap,
}: {
	annualMeanGap: number | null;
	annualMedianGap: number | null;
	hourlyMeanGap: number | null;
	hourlyMedianGap: number | null;
}) {
	return (
		<div style={sideBySideStyle}>
			<GapColumn
				columns={[
					{ label: "Moyenne", gap: annualMeanGap },
					{ label: "Médiane", gap: annualMedianGap },
				]}
				title="Annuelle brute"
			/>
			<div style={verticalSeparatorStyle} />
			<GapColumn
				columns={[
					{ label: "Moyenne", gap: hourlyMeanGap },
					{ label: "Médiane", gap: hourlyMedianGap },
				]}
				title="Horaire brute"
			/>
		</div>
	);
}

// -- Step 5 category parsing --

interface ParsedCategory {
	index: number;
	name: string;
	annualBaseGap: number | null;
	annualVariableGap: number | null;
	hourlyBaseGap: number | null;
	hourlyVariableGap: number | null;
}

function parseStep5Categories(
	step5Categories: StepCategoryData[],
): ParsedCategory[] {
	const catIndices = new Set<number>();
	for (const c of step5Categories) {
		const match = c.name.match(/^cat:(\d+):/);
		if (match) catIndices.add(Number.parseInt(match[1]!, 10));
	}

	const result: ParsedCategory[] = [];
	for (const idx of [...catIndices].sort((a, b) => a - b)) {
		const nameRow = step5Categories.find((c) =>
			c.name.startsWith(`cat:${idx}:name:`),
		);
		const catName =
			nameRow?.name.replace(`cat:${idx}:name:`, "") ||
			`Catégorie d'emplois n°${idx + 1}`;

		const annualBase = step5Categories.find(
			(c) => c.name === `cat:${idx}:annual:base`,
		);
		const annualVariable = step5Categories.find(
			(c) => c.name === `cat:${idx}:annual:variable`,
		);
		const hourlyBase = step5Categories.find(
			(c) => c.name === `cat:${idx}:hourly:base`,
		);
		const hourlyVariable = step5Categories.find(
			(c) => c.name === `cat:${idx}:hourly:variable`,
		);

		result.push({
			index: idx,
			name: catName,
			annualBaseGap:
				annualBase?.womenValue && annualBase?.menValue
					? computeGap(annualBase.womenValue, annualBase.menValue)
					: null,
			annualVariableGap:
				annualVariable?.womenValue && annualVariable?.menValue
					? computeGap(
							annualVariable.womenValue,
							annualVariable.menValue,
						)
					: null,
			hourlyBaseGap:
				hourlyBase?.womenValue && hourlyBase?.menValue
					? computeGap(hourlyBase.womenValue, hourlyBase.menValue)
					: null,
			hourlyVariableGap:
				hourlyVariable?.womenValue && hourlyVariable?.menValue
					? computeGap(
							hourlyVariable.womenValue,
							hourlyVariable.menValue,
						)
					: null,
		});
	}

	return result;
}

// -- Component --

interface Step6ReviewProps {
	step2Rows?: PayGapRow[];
	step3Data?: VariablePayData;
	step4Categories?: StepCategoryData[];
	step5Categories?: StepCategoryData[];
}

export function Step6Review({
	step2Rows = [],
	step3Data,
	step4Categories = [],
	step5Categories = [],
}: Step6ReviewProps) {
	const currentYear = new Date().getFullYear();

	// Parse step 2 gaps
	const annualMeanRow = step2Rows.find(
		(r) => r.label === "Annuelle brute moyenne",
	);
	const hourlyMeanRow = step2Rows.find(
		(r) => r.label === "Horaire brute moyenne",
	);
	const annualMedianRow = step2Rows.find(
		(r) => r.label === "Annuelle brute médiane",
	);
	const hourlyMedianRow = step2Rows.find(
		(r) => r.label === "Horaire brute médiane",
	);

	const annualMeanGap = annualMeanRow
		? computeGap(annualMeanRow.womenValue, annualMeanRow.menValue)
		: null;
	const hourlyMeanGap = hourlyMeanRow
		? computeGap(hourlyMeanRow.womenValue, hourlyMeanRow.menValue)
		: null;
	const annualMedianGap = annualMedianRow
		? computeGap(annualMedianRow.womenValue, annualMedianRow.menValue)
		: null;
	const hourlyMedianGap = hourlyMedianRow
		? computeGap(hourlyMedianRow.womenValue, hourlyMedianRow.menValue)
		: null;

	// Parse step 3 gaps
	const step3MeanRow = step3Data?.rows?.find(
		(r) => r.label === "Annuelle brute moyenne",
	);
	const step3MedianRow = step3Data?.rows?.find(
		(r) => r.label === "Annuelle brute médiane",
	);
	const step3HourlyMeanRow = step3Data?.rows?.find(
		(r) => r.label === "Horaire brute moyenne",
	);
	const step3HourlyMedianRow = step3Data?.rows?.find(
		(r) => r.label === "Horaire brute médiane",
	);
	const step3AnnualMeanGap = step3MeanRow
		? computeGap(step3MeanRow.womenValue, step3MeanRow.menValue)
		: null;
	const step3AnnualMedianGap = step3MedianRow
		? computeGap(step3MedianRow.womenValue, step3MedianRow.menValue)
		: null;
	const step3HourlyMeanGap = step3HourlyMeanRow
		? computeGap(
				step3HourlyMeanRow.womenValue,
				step3HourlyMeanRow.menValue,
			)
		: null;
	const step3HourlyMedianGap = step3HourlyMedianRow
		? computeGap(
				step3HourlyMedianRow.womenValue,
				step3HourlyMedianRow.menValue,
			)
		: null;

	// Parse step 4 quartile data
	const annualQuartiles = step4Categories.filter((c) =>
		c.name.startsWith("annual:"),
	);
	const hourlyQuartiles = step4Categories.filter((c) =>
		c.name.startsWith("hourly:"),
	);

	// Parse step 5 categories
	const step5Parsed = parseStep5Categories(step5Categories);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
	}

	return (
		<form
			onSubmit={handleSubmit}
			style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
		>
			{/* Title */}
			<h1 className="fr-h4 fr-mb-0">
				Déclaration des indicateurs de rémunération {currentYear}
			</h1>

			<StepIndicator currentStep={6} />

			{/* Description */}
			<p
				className="fr-mb-0"
				style={{ color: "var(--text-mention-grey)" }}
			>
				Vérifiez que toutes les informations ont été complétées avant de
				soumettre votre déclaration aux services du ministère chargé du
				travail.
			</p>

			{/* Card 1: Écart de rémunération (Step 2) */}
			<div style={cardStyle}>
				<CardTitle>Écart de rémunération</CardTitle>

				{step2Rows.length > 0 ? (
					<GapSideBySide
						annualMeanGap={annualMeanGap}
						annualMedianGap={annualMedianGap}
						hourlyMeanGap={hourlyMeanGap}
						hourlyMedianGap={hourlyMedianGap}
					/>
				) : (
					<p
						className="fr-mb-0"
						style={{ color: "var(--text-mention-grey)" }}
					>
						Aucune donnée renseignée.
					</p>
				)}
			</div>

			{/* Card 2: Rémunération variable (Step 3) */}
			<div style={cardStyle}>
				<CardTitle>
					Écart de rémunération variable ou complémentaire
				</CardTitle>

				{step3Data?.rows && step3Data.rows.length > 0 ? (
					<>
						<GapSideBySide
							annualMeanGap={step3AnnualMeanGap}
							annualMedianGap={step3AnnualMedianGap}
							hourlyMeanGap={step3HourlyMeanGap}
							hourlyMedianGap={step3HourlyMedianGap}
						/>

						<div style={sideBySideStyle}>
							<div style={columnStyle}>
								<p className="fr-text--bold fr-text--sm fr-mb-0">
									Proportion
								</p>
								<div
									style={{
										display: "flex",
										gap: "1.5rem",
									}}
								>
									<div style={{ flex: 1 }}>
										<p
											className="fr-text--xs fr-mb-0"
											style={{
												color: "var(--text-mention-grey)",
											}}
										>
											Femmes
										</p>
										<strong>
											{step3Data.beneficiaryWomen
												? `${step3Data.beneficiaryWomen} %`
												: "-"}
										</strong>
									</div>
									<div style={{ flex: 1 }}>
										<p
											className="fr-text--xs fr-mb-0"
											style={{
												color: "var(--text-mention-grey)",
											}}
										>
											Hommes
										</p>
										<strong>
											{step3Data.beneficiaryMen
												? `${step3Data.beneficiaryMen} %`
												: "-"}
										</strong>
									</div>
								</div>
							</div>
							<div style={verticalSeparatorStyle} />
							<div style={columnStyle} />
						</div>
					</>
				) : (
					<p
						className="fr-mb-0"
						style={{ color: "var(--text-mention-grey)" }}
					>
						Aucune donnée renseignée.
					</p>
				)}
			</div>

			{/* Card 3: Proportion par quartile (Step 4) */}
			<div style={cardStyle}>
				<CardTitle tooltipId="tooltip-quartile">
					Proportion de femmes et d&apos;hommes dans chaque quartile
					salarial
				</CardTitle>

				{annualQuartiles.length > 0 || hourlyQuartiles.length > 0 ? (
					<>
						{annualQuartiles.length > 0 && (
							<QuartileColumn
								title="Rémunération annuelle brute moyenne"
								quartiles={annualQuartiles.map((q) => ({
									label: q.name.replace("annual:", ""),
									womenCount: q.womenCount ?? 0,
									menCount: q.menCount ?? 0,
								}))}
							/>
						)}
						{hourlyQuartiles.length > 0 && (
							<QuartileColumn
								title="Rémunération horaire brute moyenne"
								quartiles={hourlyQuartiles.map((q) => ({
									label: q.name.replace("hourly:", ""),
									womenCount: q.womenCount ?? 0,
									menCount: q.menCount ?? 0,
								}))}
							/>
						)}
					</>
				) : (
					<p
						className="fr-mb-0"
						style={{ color: "var(--text-mention-grey)" }}
					>
						Aucune donnée renseignée.
					</p>
				)}
			</div>

			{/* Card 4: Catégories de salariés (Step 5) */}
			<div style={cardStyle}>
				<CardTitle tooltipId="tooltip-categories">
					Écart de rémunération par catégories de salariés
				</CardTitle>

				{step5Parsed.length > 0 ? (
					step5Parsed.map((cat) => (
						<div key={cat.index}>
							<p className="fr-text--bold fr-mb-0">
								{cat.name}
							</p>

							<div style={sideBySideStyle}>
								<GapColumn
									columns={[
										{
											label: "Salaire de base",
											gap: cat.annualBaseGap,
										},
										{
											label: "Composantes variables",
											gap: cat.annualVariableGap,
										},
									]}
									title="Annuelle brute"
								/>
								<div style={verticalSeparatorStyle} />
								<GapColumn
									columns={[
										{
											label: "Salaire de base",
											gap: cat.hourlyBaseGap,
										},
										{
											label: "Composantes variables",
											gap: cat.hourlyVariableGap,
										},
									]}
									title="Horaire brute"
								/>
							</div>
						</div>
					))
				) : (
					<p
						className="fr-mb-0"
						style={{ color: "var(--text-mention-grey)" }}
					>
						Aucune donnée renseignée.
					</p>
				)}
			</div>

			<FormActions
				nextHref="/"
				nextLabel="Suivant"
				previousHref="/declaration/etape/5"
			/>
		</form>
	);
}

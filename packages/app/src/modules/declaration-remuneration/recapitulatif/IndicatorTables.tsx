import type {
	Step2Data,
	Step3Data,
	Step4Data,
} from "~/modules/declaration-remuneration/types";
import {
	computeGap,
	computePercentage,
	formatCurrency,
	formatGap,
	GAP_ALERT_THRESHOLD,
} from "~/modules/domain";
import styles from "./IndicatorTables.module.scss";

type Props = {
	declarationYear: number;
	totalWomen: number | null;
	totalMen: number | null;
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
};

type GapRow = {
	label: string;
	women: string;
	men: string;
};

function HighGapBadge() {
	return <span className={styles.highBadge}>élevé</span>;
}

function GapCell({ gap }: { gap: number | null }) {
	const isHigh = gap !== null && gap >= GAP_ALERT_THRESHOLD;
	return (
		<span className={styles.gapCell}>
			<strong>{formatGap(gap)}</strong>
			{isHigh && <HighGapBadge />}
		</span>
	);
}

/** 4-row pay-gap table (annuelle/horaire × moyenne/médiane). */
function GapTable({
	caption,
	rowLabel,
	rows,
}: {
	caption: string;
	rowLabel: string;
	rows: GapRow[];
}) {
	const allEmpty = rows.every((r) => r.women === "" && r.men === "");
	if (allEmpty) {
		return <p className={styles.emptyNotice}>Aucune donnée renseignée.</p>;
	}
	return (
		<div className="fr-table fr-table--no-caption fr-mt-0 fr-mb-0">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption>{caption}</caption>
							<thead>
								<tr>
									<th scope="col">{rowLabel}</th>
									<th scope="col">Femmes</th>
									<th scope="col">Hommes</th>
									<th scope="col">
										Écart{" "}
										<span className={styles.gapHeaderHint}>
											Seuil réglementaire : 5 %
										</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((row) => {
									const gap = computeGap(row.women, row.men);
									return (
										<tr key={row.label}>
											<th scope="row">{row.label}</th>
											<td className={styles.numeric}>
												{formatCurrency(row.women)}
											</td>
											<td className={styles.numeric}>
												{formatCurrency(row.men)}
											</td>
											<td className={styles.gapNumeric}>
												<GapCell gap={gap} />
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

/** Workforce row (Femmes / Hommes / Total). */
function WorkforceTable({
	totalWomen,
	totalMen,
}: {
	totalWomen: number | null;
	totalMen: number | null;
}) {
	const total = (totalWomen ?? 0) + (totalMen ?? 0);
	return (
		<div className="fr-table fr-table--no-caption fr-mt-0 fr-mb-0">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption>Effectifs physiques pris en compte</caption>
							<thead>
								<tr>
									<th scope="col" />
									<th scope="col">Femmes</th>
									<th scope="col">Hommes</th>
									<th scope="col">Total</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<th scope="row">Nombre de salariés</th>
									<td className={styles.numeric}>{totalWomen ?? 0}</td>
									<td className={styles.numeric}>{totalMen ?? 0}</td>
									<td className={styles.numeric}>
										<strong>{total}</strong>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

/** Proportion of women/men benefiting from variable or complementary pay. */
function ProportionTable({
	totalWomen,
	totalMen,
	indicatorEWomen,
	indicatorEMen,
}: {
	totalWomen: number | null;
	totalMen: number | null;
	indicatorEWomen: string;
	indicatorEMen: string;
}) {
	if (indicatorEWomen === "" && indicatorEMen === "") return null;
	const eWomen = Number.parseInt(indicatorEWomen, 10);
	const eMen = Number.parseInt(indicatorEMen, 10);
	const tWomen = totalWomen ?? 0;
	const tMen = totalMen ?? 0;
	const grandTotal = tWomen + tMen;
	return (
		<div className="fr-table fr-table--no-caption fr-mt-0 fr-mb-0">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption>
								Proportion de femmes et d&apos;hommes bénéficiant d&apos;une
								rémunération variable ou complémentaire
							</caption>
							<thead>
								<tr>
									<th scope="col">Sexe</th>
									<th scope="col">Total de salariés : {grandTotal}</th>
									<th scope="col">
										Bénéficiaires de composantes variables ou complémentaires
									</th>
									<th scope="col">Proportion</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<th scope="row">Femmes</th>
									<td className={styles.numeric}>
										<strong>{tWomen}</strong>
									</td>
									<td className={styles.numeric}>
										{Number.isNaN(eWomen) ? "-" : eWomen}
									</td>
									<td className={styles.numeric}>
										<strong>
											{Number.isNaN(eWomen)
												? "-"
												: computePercentage(eWomen, tWomen)}
										</strong>
									</td>
								</tr>
								<tr>
									<th scope="row">Hommes</th>
									<td className={styles.numeric}>
										<strong>{tMen}</strong>
									</td>
									<td className={styles.numeric}>
										{Number.isNaN(eMen) ? "-" : eMen}
									</td>
									<td className={styles.numeric}>
										<strong>
											{Number.isNaN(eMen) ? "-" : computePercentage(eMen, tMen)}
										</strong>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

const QUARTILE_LABELS = [
	"1er quartile",
	"2e quartile",
	"3e quartile",
	"4e quartile",
] as const;

/** Quartile distribution table — rows are quartiles, columns are Min/Max/Nb F/Nb H/% F/% H. */
function QuartileDistributionTable({
	caption,
	title,
	quartiles,
	unit,
}: {
	caption: string;
	title: string;
	quartiles: Step4Data["annual"];
	unit: "€" | "€/h";
}) {
	const hasData = quartiles.some(
		(q) => q.threshold !== "" || q.women !== undefined || q.men !== undefined,
	);
	if (!hasData) return null;
	const totalWomen = quartiles.reduce((s, q) => s + (q.women ?? 0), 0);
	const totalMen = quartiles.reduce((s, q) => s + (q.men ?? 0), 0);
	const total = totalWomen + totalMen;

	function fmt(value: string | undefined) {
		if (!value) return "-";
		const n = Number.parseFloat(value);
		if (Number.isNaN(n)) return "-";
		return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit}`;
	}

	return (
		<div className={styles.subTable}>
			<p className={`fr-text--bold ${styles.subTitle}`}>{title}</p>
			<div className="fr-table fr-table--no-caption fr-mt-0 fr-mb-0">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption>{caption}</caption>
								<thead>
									<tr>
										<th scope="col">Tranche de rémunération</th>
										<th scope="col">Min</th>
										<th scope="col">Max</th>
										<th scope="col">Nombre de femmes</th>
										<th scope="col">Nombre d&apos;hommes</th>
										<th scope="col">Pourcentage de femmes</th>
										<th scope="col">Pourcentage d&apos;hommes</th>
									</tr>
								</thead>
								<tbody>
									{quartiles.map((q, i) => {
										const prev =
											i === 0 ? "0" : (quartiles[i - 1]?.threshold ?? "");
										const min = i === 0 ? `0 ${unit}` : fmt(prev);
										const max = i === 3 ? "-" : fmt(q.threshold);
										const lineTotal = (q.women ?? 0) + (q.men ?? 0);
										return (
											<tr key={QUARTILE_LABELS[i]}>
												<th scope="row">{QUARTILE_LABELS[i]}</th>
												<td className={styles.numeric}>{min}</td>
												<td className={styles.numeric}>{max}</td>
												<td className={styles.numeric}>
													{q.women !== undefined ? q.women : "-"}
												</td>
												<td className={styles.numeric}>
													{q.men !== undefined ? q.men : "-"}
												</td>
												<td className={styles.numeric}>
													{lineTotal > 0
														? computePercentage(q.women ?? 0, lineTotal)
														: "-"}
												</td>
												<td className={styles.numeric}>
													{lineTotal > 0
														? computePercentage(q.men ?? 0, lineTotal)
														: "-"}
												</td>
											</tr>
										);
									})}
									<tr>
										<th scope="row">Tous les salariés</th>
										<td colSpan={2} />
										<td className={styles.numeric}>
											<strong>{totalWomen || "-"}</strong>
										</td>
										<td className={styles.numeric}>
											<strong>{totalMen || "-"}</strong>
										</td>
										<td className={styles.numeric}>
											<strong>
												{total > 0 ? computePercentage(totalWomen, total) : "-"}
											</strong>
										</td>
										<td className={styles.numeric}>
											<strong>
												{total > 0 ? computePercentage(totalMen, total) : "-"}
											</strong>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export function IndicatorTables({
	declarationYear,
	totalWomen,
	totalMen,
	step2Data,
	step3Data,
	step4Data,
}: Props) {
	const step2Rows: GapRow[] = [
		{
			label: "Annuelle brute moyenne",
			women: step2Data.indicatorAAnnualWomen,
			men: step2Data.indicatorAAnnualMen,
		},
		{
			label: "Horaire brute moyenne",
			women: step2Data.indicatorAHourlyWomen,
			men: step2Data.indicatorAHourlyMen,
		},
		{
			label: "Annuelle brute médiane",
			women: step2Data.indicatorCAnnualWomen,
			men: step2Data.indicatorCAnnualMen,
		},
		{
			label: "Horaire brute médiane",
			women: step2Data.indicatorCHourlyWomen,
			men: step2Data.indicatorCHourlyMen,
		},
	];

	const step3Rows: GapRow[] = [
		{
			label: "Annuelle brute moyenne",
			women: step3Data.indicatorBAnnualWomen,
			men: step3Data.indicatorBAnnualMen,
		},
		{
			label: "Horaire brute moyenne",
			women: step3Data.indicatorBHourlyWomen,
			men: step3Data.indicatorBHourlyMen,
		},
		{
			label: "Annuelle brute médiane",
			women: step3Data.indicatorDAnnualWomen,
			men: step3Data.indicatorDAnnualMen,
		},
		{
			label: "Horaire brute médiane",
			women: step3Data.indicatorDHourlyWomen,
			men: step3Data.indicatorDHourlyMen,
		},
	];

	return (
		<>
			<section className={styles.section}>
				<h3 className="fr-h6 fr-mb-0">
					Effectifs physiques pris en compte pour le calcul des indicateurs
				</h3>
				<WorkforceTable totalMen={totalMen} totalWomen={totalWomen} />
			</section>

			<section className={styles.section}>
				<h3 className="fr-h6 fr-mb-0">Écart de rémunération</h3>
				<GapTable
					caption={`Écart de rémunération – ${declarationYear}`}
					rowLabel="Rémunération"
					rows={step2Rows}
				/>
			</section>

			<section className={styles.section}>
				<h3 className="fr-h6 fr-mb-0">
					Écart de rémunération variable ou complémentaire
				</h3>
				<GapTable
					caption={`Écart de rémunération variable ou complémentaire – ${declarationYear}`}
					rowLabel="Rémunération variable ou complémentaire"
					rows={step3Rows}
				/>
				<ProportionTable
					indicatorEMen={step3Data.indicatorEMen}
					indicatorEWomen={step3Data.indicatorEWomen}
					totalMen={totalMen}
					totalWomen={totalWomen}
				/>
			</section>

			<section className={styles.section}>
				<h3 className="fr-h6 fr-mb-0">
					Proportion de femmes et d&apos;hommes dans chaque quartile salarial
				</h3>
				<QuartileDistributionTable
					caption={`Quartile annuel – ${declarationYear}`}
					quartiles={step4Data.annual}
					title="Rémunération annuelle brute moyenne"
					unit="€"
				/>
				<QuartileDistributionTable
					caption={`Quartile horaire – ${declarationYear}`}
					quartiles={step4Data.hourly}
					title="Rémunération horaire brute moyenne"
					unit="€/h"
				/>
			</section>
		</>
	);
}

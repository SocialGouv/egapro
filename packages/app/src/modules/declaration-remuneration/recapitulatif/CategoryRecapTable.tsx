import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import {
	computeGap,
	computeGapBetween,
	computeTotal,
	computeWorkforceTotal,
	formatCurrency,
	formatGap,
	formatTotal,
	GAP_ALERT_THRESHOLD,
} from "~/modules/domain";
import styles from "./CategoryRecapTable.module.scss";
import indicatorStyles from "./IndicatorTables.module.scss";

type Props = {
	index: number;
	category: EmployeeCategoryRow;
	declarationYear: number;
};

function GapCell({ gap }: { gap: number | null }) {
	const isHigh = gap !== null && gap >= GAP_ALERT_THRESHOLD;
	return (
		<span className={indicatorStyles.gapCell}>
			<strong>{formatGap(gap)}</strong>
			{isHigh && <span className={indicatorStyles.highBadge}>élevé</span>}
		</span>
	);
}

/** One employee-category recap table — 11 rows: header → effectif → annuel section → horaire section. */
export function CategoryRecapTable({
	index,
	category,
	declarationYear,
}: Props) {
	const womenCount = category.womenCount ?? 0;
	const menCount = category.menCount ?? 0;
	const totalSalaries = computeWorkforceTotal(womenCount, menCount);

	const annualWomenSum = computeTotal(
		category.annualBaseWomen ?? "",
		category.annualVariableWomen ?? "",
	);
	const annualMenSum = computeTotal(
		category.annualBaseMen ?? "",
		category.annualVariableMen ?? "",
	);

	const hourlyWomenSum = computeTotal(
		category.hourlyBaseWomen ?? "",
		category.hourlyVariableWomen ?? "",
	);
	const hourlyMenSum = computeTotal(
		category.hourlyBaseMen ?? "",
		category.hourlyVariableMen ?? "",
	);

	const annualBaseGap = computeGap(
		category.annualBaseWomen ?? "",
		category.annualBaseMen ?? "",
	);
	const annualVarGap = computeGap(
		category.annualVariableWomen ?? "",
		category.annualVariableMen ?? "",
	);
	const annualTotalGap =
		annualWomenSum !== null && annualMenSum !== null
			? computeGapBetween(annualWomenSum, annualMenSum)
			: null;

	const hourlyBaseGap = computeGap(
		category.hourlyBaseWomen ?? "",
		category.hourlyBaseMen ?? "",
	);
	const hourlyVarGap = computeGap(
		category.hourlyVariableWomen ?? "",
		category.hourlyVariableMen ?? "",
	);
	const hourlyTotalGap =
		hourlyWomenSum !== null && hourlyMenSum !== null
			? computeGapBetween(hourlyWomenSum, hourlyMenSum)
			: null;

	const heading = `Catégorie d'emplois n°${index + 1}${category.name ? ` : ${category.name}` : ""}`;

	return (
		<section className={styles.section}>
			<p className={`fr-text--bold ${styles.heading}`}>{heading}</p>
			<div className="fr-table fr-table--no-caption fr-mt-0 fr-mb-0">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption>{`${heading} – ${declarationYear}`}</caption>
								<thead>
									<tr>
										<th scope="col" />
										<th scope="col">Femmes</th>
										<th scope="col">Hommes</th>
										<th scope="col">
											Écart{" "}
											<span className={indicatorStyles.gapHeaderHint}>
												Seuil réglementaire : 5 %
											</span>
										</th>
									</tr>
								</thead>
								<tbody>
									<tr className={styles.subheaderRow}>
										<th colSpan={4} scope="colgroup">
											Total salariés : {totalSalaries}
										</th>
									</tr>
									<tr className={styles.regularRow}>
										<th scope="row">Effectif physique</th>
										<td className={indicatorStyles.numeric}>{womenCount} nb</td>
										<td className={indicatorStyles.numeric}>{menCount} nb</td>
										<td />
									</tr>

									<tr className={styles.sectionRow}>
										<th colSpan={4} scope="colgroup">
											Rémunération annuelle brute
										</th>
									</tr>
									<tr className={styles.regularRow}>
										<th scope="row">Salaire de base</th>
										<td className={indicatorStyles.numeric}>
											{formatCurrency(category.annualBaseWomen)}
										</td>
										<td className={indicatorStyles.numeric}>
											{formatCurrency(category.annualBaseMen)}
										</td>
										<td className={indicatorStyles.gapNumeric}>
											<GapCell gap={annualBaseGap} />
										</td>
									</tr>
									<tr className={styles.regularRow}>
										<th scope="row">
											Composantes variables
											<br />
											ou complémentaires
										</th>
										<td className={indicatorStyles.numeric}>
											{formatCurrency(category.annualVariableWomen)}
										</td>
										<td className={indicatorStyles.numeric}>
											{formatCurrency(category.annualVariableMen)}
										</td>
										<td className={indicatorStyles.gapNumeric}>
											<GapCell gap={annualVarGap} />
										</td>
									</tr>
									<tr className={styles.totalRow}>
										<th scope="row">Total</th>
										<td className={indicatorStyles.numeric}>
											<strong>{formatTotal(annualWomenSum, "€")}</strong>
										</td>
										<td className={indicatorStyles.numeric}>
											<strong>{formatTotal(annualMenSum, "€")}</strong>
										</td>
										<td className={indicatorStyles.gapNumeric}>
											<GapCell gap={annualTotalGap} />
										</td>
									</tr>

									<tr className={styles.sectionRow}>
										<th colSpan={4} scope="colgroup">
											Rémunération horaire brute
										</th>
									</tr>
									<tr className={styles.regularRow}>
										<th scope="row">Salaire de base</th>
										<td className={indicatorStyles.numeric}>
											{formatCurrency(category.hourlyBaseWomen)}
										</td>
										<td className={indicatorStyles.numeric}>
											{formatCurrency(category.hourlyBaseMen)}
										</td>
										<td className={indicatorStyles.gapNumeric}>
											<GapCell gap={hourlyBaseGap} />
										</td>
									</tr>
									<tr className={styles.regularRow}>
										<th scope="row">
											Composantes variables
											<br />
											ou complémentaires
										</th>
										<td className={indicatorStyles.numeric}>
											{formatCurrency(category.hourlyVariableWomen)}
										</td>
										<td className={indicatorStyles.numeric}>
											{formatCurrency(category.hourlyVariableMen)}
										</td>
										<td className={indicatorStyles.gapNumeric}>
											<GapCell gap={hourlyVarGap} />
										</td>
									</tr>
									<tr className={styles.totalRow}>
										<th scope="row">Total</th>
										<td className={indicatorStyles.numeric}>
											<strong>{formatTotal(hourlyWomenSum, "€")}</strong>
										</td>
										<td className={indicatorStyles.numeric}>
											<strong>{formatTotal(hourlyMenSum, "€")}</strong>
										</td>
										<td className={indicatorStyles.gapNumeric}>
											<GapCell gap={hourlyTotalGap} />
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

import { CATEGORY_WORKFORCE_ROWS } from "~/modules/declaration-remuneration/steps/step5/categoryWorkforceRows";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import {
	computeGap,
	computeTotal,
	computeWorkforceTotal,
	formatCurrency,
	formatGap,
	formatTotal,
	gapLevel,
} from "~/modules/domain";
import styles from "./CategoryRecapTable.module.scss";
import indicatorStyles from "./IndicatorTables.module.scss";

type Props = {
	index: number;
	category: EmployeeCategoryRow;
	declarationYear: number;
};

function GapCell({ gap }: { gap: number | null }) {
	const isHigh = gapLevel(gap) === "high";
	return (
		<span className={indicatorStyles.gapCell}>
			<strong>{formatGap(gap)}</strong>
			{isHigh && <span className={indicatorStyles.highBadge}>élevé</span>}
		</span>
	);
}

/** An hourly headcount can be absent on categories entered before #4254 —
 *  never invent a 0 for it. */
function formatWorkforceCount(value: number | null): string {
	return value === null ? "—" : String(value);
}

/** Physical-headcount table, one row per pay basis (#4368) — same shape and
 *  labels as the company-level `WorkforceTable` in IndicatorTables.tsx and
 *  the step-5 `CategoryDataTable`, with the row total computed the same way
 *  (`null` — shown as "—" — when either side is missing, never a summed 0). */
function CategoryEffectifTable({
	category,
	heading,
}: {
	category: EmployeeCategoryRow;
	heading: string;
}) {
	return (
		<div className="fr-table fr-table--no-caption fr-mt-0 fr-mb-0">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption>{`${heading} – Effectifs physiques`}</caption>
							<thead>
								<tr>
									<th scope="col">Nombre de salariés</th>
									<th scope="col">Femmes</th>
									<th scope="col">Hommes</th>
									<th scope="col">Total</th>
								</tr>
							</thead>
							<tbody>
								{CATEGORY_WORKFORCE_ROWS.map((row) => {
									const women = category[row.womenField];
									const men = category[row.menField];
									const total =
										women !== null && men !== null
											? computeWorkforceTotal(women, men)
											: null;
									return (
										<tr
											className={styles.regularRow}
											key={row.workforceRow.basis}
										>
											<th scope="row">{row.workforceRow.label}</th>
											<td className={indicatorStyles.numeric}>
												{formatWorkforceCount(women)}
											</td>
											<td className={indicatorStyles.numeric}>
												{formatWorkforceCount(men)}
											</td>
											<td className={indicatorStyles.numeric}>
												<strong>{total === null ? "—" : total}</strong>
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

/** One employee-category recap: a headcount table (one row per pay basis) followed
 *  by a 10-row pay table (header → annuel section → horaire section). */
export function CategoryRecapTable({
	index,
	category,
	declarationYear,
}: Props) {
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

	const hourlyBaseGap = computeGap(
		category.hourlyBaseWomen ?? "",
		category.hourlyBaseMen ?? "",
	);
	const hourlyVarGap = computeGap(
		category.hourlyVariableWomen ?? "",
		category.hourlyVariableMen ?? "",
	);

	const heading = `Catégorie d'emplois n°${index + 1}${category.name ? ` : ${category.name}` : ""}`;

	return (
		<section className={styles.section}>
			<p className={`fr-text--bold ${styles.heading}`}>{heading}</p>
			<CategoryEffectifTable category={category} heading={heading} />
			<div className="fr-table fr-table--no-caption fr-mt-0 fr-mb-0">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption>{`${heading} – ${declarationYear}`}</caption>
								<thead>
									<tr>
										<th scope="col">
											<span className="fr-sr-only">Donnée</span>
										</th>
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
										<td>
											<span className="fr-sr-only">Non applicable</span>
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
										<td>
											<span className="fr-sr-only">Non applicable</span>
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

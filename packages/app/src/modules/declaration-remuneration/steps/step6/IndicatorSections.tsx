import { Fragment } from "react";
import { QUARTILE_NAMES } from "~/modules/declaration-remuneration/shared/constants";
import stepStyles from "~/modules/declaration-remuneration/steps/Step6Review.module.scss";
import type {
	EmployeeCategoryRow,
	Step2Data,
	Step3Data,
	Step4Data,
} from "~/modules/declaration-remuneration/types";
import { computeGap, computeProportion } from "~/modules/domain";
import { CardTitle } from "./CardTitle";
import { GapColumn } from "./GapColumn";
import { GapSideBySide } from "./GapSideBySide";
import { parseEmployeeCategories } from "./parseStep5Categories";
import { QuartileColumn } from "./QuartileColumn";

type Props = {
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
	step5Categories: EmployeeCategoryRow[];
	totalWomen?: number;
	totalMen?: number;
	/**
	 * In the Step6Review (in-flow) the cards expose tooltips for the quartile
	 * and category sections. The post-submission recap renders the same cards
	 * read-only without the help tooltips.
	 */
	withTooltips?: boolean;
};

function EmptyDataNotice() {
	return <p className="fr-mb-0">Aucune donnée renseignée.</p>;
}

/**
 * The 4 indicator cards (pay gap, variable pay, quartile, by category) that
 * Step6Review and the post-submission recap both render. Extracted so the
 * 150+ lines of JSX live in one place — both pages compose the section
 * inside their own surrounding layout.
 */
export function IndicatorSections({
	step2Data,
	step3Data,
	step4Data,
	step5Categories,
	totalWomen,
	totalMen,
	withTooltips = false,
}: Props) {
	const annualMeanGap = computeGap(
		step2Data.indicatorAAnnualWomen,
		step2Data.indicatorAAnnualMen,
	);
	const hourlyMeanGap = computeGap(
		step2Data.indicatorAHourlyWomen,
		step2Data.indicatorAHourlyMen,
	);
	const annualMedianGap = computeGap(
		step2Data.indicatorCAnnualWomen,
		step2Data.indicatorCAnnualMen,
	);
	const hourlyMedianGap = computeGap(
		step2Data.indicatorCHourlyWomen,
		step2Data.indicatorCHourlyMen,
	);
	const hasStep2Data = Object.values(step2Data).some((v) => v !== "");

	const step3AnnualMeanGap = computeGap(
		step3Data.indicatorBAnnualWomen,
		step3Data.indicatorBAnnualMen,
	);
	const step3HourlyMeanGap = computeGap(
		step3Data.indicatorBHourlyWomen,
		step3Data.indicatorBHourlyMen,
	);
	const step3AnnualMedianGap = computeGap(
		step3Data.indicatorDAnnualWomen,
		step3Data.indicatorDAnnualMen,
	);
	const step3HourlyMedianGap = computeGap(
		step3Data.indicatorDHourlyWomen,
		step3Data.indicatorDHourlyMen,
	);
	const hasStep3Data = Object.values(step3Data).some((v) => v !== "");

	const hasStep4Data =
		step4Data.annual.some((q) => q.threshold || q.women !== undefined) ||
		step4Data.hourly.some((q) => q.threshold || q.women !== undefined);

	const step5Parsed = parseEmployeeCategories(step5Categories);

	return (
		<>
			<div className={stepStyles.group}>
				<h2 className="fr-h6 fr-mb-0">
					Indicateurs pour l&apos;ensemble de vos salariés
				</h2>

				<div className={stepStyles.section}>
					{/* Card: Pay gap (Step 2) */}
					<div className={stepStyles.card}>
						<CardTitle>Écart de rémunération</CardTitle>
						{hasStep2Data ? (
							<GapSideBySide
								annualMeanGap={annualMeanGap}
								annualMedianGap={annualMedianGap}
								hourlyMeanGap={hourlyMeanGap}
								hourlyMedianGap={hourlyMedianGap}
							/>
						) : (
							<EmptyDataNotice />
						)}
					</div>

					{/* Card: Variable pay (Step 3) */}
					<div className={stepStyles.card}>
						<CardTitle>
							Écart de rémunération variable ou complémentaire
						</CardTitle>
						{hasStep3Data ? (
							<>
								<GapSideBySide
									annualMeanGap={step3AnnualMeanGap}
									annualMedianGap={step3AnnualMedianGap}
									hourlyMeanGap={step3HourlyMeanGap}
									hourlyMedianGap={step3HourlyMedianGap}
								/>
								<div className={stepStyles.sideBySide}>
									<div className={stepStyles.column}>
										<p className="fr-text--bold fr-text--sm fr-mb-0">
											Proportion
										</p>
										<div className={stepStyles.subSection}>
											<div className={stepStyles.flex1}>
												<p className="fr-text--sm fr-mb-0">Femmes</p>
												<strong className="fr-text--sm">
													{computeProportion(
														step3Data.indicatorEWomen,
														totalWomen,
													)}
												</strong>
											</div>
											<div className={stepStyles.flex1}>
												<p className="fr-text--sm fr-mb-0">Hommes</p>
												<strong className="fr-text--sm">
													{computeProportion(step3Data.indicatorEMen, totalMen)}
												</strong>
											</div>
										</div>
									</div>
									<div className={stepStyles.verticalSeparator} />
									<div className={stepStyles.column} />
								</div>
							</>
						) : (
							<EmptyDataNotice />
						)}
					</div>

					{/* Card: Quartile distribution (Step 4) */}
					<div className={stepStyles.card}>
						<CardTitle
							tooltipId={withTooltips ? "tooltip-quartile" : undefined}
						>
							Proportion de femmes et d&apos;hommes dans chaque quartile
							salarial
						</CardTitle>
						{hasStep4Data ? (
							<>
								<QuartileColumn
									quartiles={step4Data.annual.map((q, i) => ({
										label: QUARTILE_NAMES[i] ?? "",
										womenCount: q.women ?? 0,
										menCount: q.men ?? 0,
									}))}
									title="Rémunération annuelle brute moyenne"
								/>
								<QuartileColumn
									quartiles={step4Data.hourly.map((q, i) => ({
										label: QUARTILE_NAMES[i] ?? "",
										womenCount: q.women ?? 0,
										menCount: q.men ?? 0,
									}))}
									title="Rémunération horaire brute moyenne"
								/>
							</>
						) : (
							<EmptyDataNotice />
						)}
					</div>
				</div>
			</div>

			<div className={stepStyles.group}>
				<h2 className="fr-h6 fr-mb-0">Indicateurs par catégorie de salariés</h2>

				{/* Card: Employee categories (Step 5) */}
				<div className={stepStyles.card}>
					<CardTitle
						tooltipId={withTooltips ? "tooltip-categories" : undefined}
					>
						Écart de rémunération par catégories de salariés
					</CardTitle>
					{step5Parsed.length > 0 ? (
						step5Parsed.map((cat) => {
							const categoryColumns = [
								{
									title: "Annuelle brute",
									base: cat.annualBaseGap,
									variable: cat.annualVariableGap,
								},
								{
									title: "Horaire brute",
									base: cat.hourlyBaseGap,
									variable: cat.hourlyVariableGap,
								},
							];
							return (
								<div key={cat.index}>
									<p className="fr-text--bold fr-text--sm fr-mb-0">
										{cat.name}
									</p>
									<div className={stepStyles.sideBySide}>
										{categoryColumns.map((col, index) => (
											<Fragment key={col.title}>
												{index > 0 && (
													<div className={stepStyles.verticalSeparator} />
												)}
												<GapColumn
													columns={[
														{ label: "Salaire de base", gap: col.base },
														{
															label: "Composantes variables ou complémentaires",
															gap: col.variable,
														},
													]}
													title={col.title}
												/>
											</Fragment>
										))}
									</div>
								</div>
							);
						})
					) : (
						<EmptyDataNotice />
					)}
				</div>
			</div>
		</>
	);
}

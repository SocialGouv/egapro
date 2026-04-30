import Link from "next/link";
import { DownloadDeclarationPdfButton } from "~/modules/declarationPdf";
import { computeGap } from "~/modules/domain";
import { ResourceBanner } from "~/modules/layout";
import common from "../shared/common.module.scss";
import { QUARTILE_NAMES } from "../shared/constants";
import stepStyles from "../steps/Step6Review.module.scss";
import {
	CardTitle,
	GapColumn,
	GapSideBySide,
	parseEmployeeCategories,
	QuartileColumn,
} from "../steps/step6";
import type {
	EmployeeCategoryRow,
	Step2Data,
	Step3Data,
	Step4Data,
} from "../types";

function EmptyDataNotice() {
	return (
		<p className={`fr-mb-0 ${common.mentionGrey}`}>Aucune donnée renseignée.</p>
	);
}

type CompanyInfo = {
	name: string;
	siren: string;
	nafCode: string | null;
	address: string | null;
};

type Props = {
	company: CompanyInfo;
	declarationYear: number;
	declarantEmail: string;
	isCorrection: boolean;
	totalWomen: number | null;
	totalMen: number | null;
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
	step5Categories: EmployeeCategoryRow[];
};

export function RecapitulatifPage({
	company,
	declarationYear,
	declarantEmail,
	isCorrection,
	totalWomen,
	totalMen,
	step2Data,
	step3Data,
	step4Data,
	step5Categories,
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

	const periodStart = `01/01/${declarationYear}`;
	const periodEnd = `31/12/${declarationYear}`;

	const totalWorkforce = (totalWomen ?? 0) + (totalMen ?? 0);

	return (
		<>
			<div className={common.flexColumnGap2}>
				{/* Title row */}
				<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
					<div className="fr-col">
						<h1 className="fr-h2 fr-mb-0">
							Déclaration des indicateurs de rémunération {declarationYear}
						</h1>
					</div>
					<div className="fr-col-auto">
						<DownloadDeclarationPdfButton
							correction={isCorrection}
							variant="tertiary"
							year={declarationYear}
						/>
					</div>
				</div>

				{/* Section: Declarant info */}
				<section>
					<h2 className="fr-h6 fr-mb-2w">Informations déclarant</h2>
					<div className="fr-table fr-table--no-caption">
						<table>
							<caption>Informations déclarant</caption>
							<tbody>
								<tr>
									<th scope="row">Mail déclarant</th>
									<td>{declarantEmail}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				{/* Section: Company info */}
				<section>
					<h2 className="fr-h6 fr-mb-2w">Informations entreprise</h2>
					<div className="fr-table fr-table--no-caption">
						<table>
							<caption>Informations entreprise</caption>
							<tbody>
								<tr>
									<th scope="row">Raison sociale</th>
									<td>{company.name}</td>
								</tr>
								<tr>
									<th scope="row">SIREN</th>
									<td>{company.siren}</td>
								</tr>
								{company.nafCode && (
									<tr>
										<th scope="row">Code NAF</th>
										<td>{company.nafCode}</td>
									</tr>
								)}
								{company.address && (
									<tr>
										<th scope="row">Adresse</th>
										<td>{company.address}</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</section>

				{/* Section: Reference period */}
				<section>
					<h2 className="fr-h6 fr-mb-2w">Informations période de référence</h2>
					<div className="fr-table fr-table--no-caption">
						<table>
							<caption>Informations période de référence</caption>
							<tbody>
								<tr>
									<th scope="row">Date de début</th>
									<td>{periodStart}</td>
								</tr>
								<tr>
									<th scope="row">Date de fin</th>
									<td>{periodEnd}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				{/* Section: Indicators for all employees */}
				<h2 className="fr-h6 fr-mb-0">
					Indicateurs pour l&apos;ensemble de vos salariés
				</h2>

				<div className={stepStyles.section}>
					{/* Card: Workforce */}
					<div className={stepStyles.card}>
						<CardTitle>Effectif</CardTitle>
						<div className="fr-table fr-table--no-caption">
							<table>
								<caption>Effectif</caption>
								<thead>
									<tr>
										<th scope="col">Femmes</th>
										<th scope="col">Hommes</th>
										<th scope="col">Total</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>{totalWomen ?? 0}</td>
										<td>{totalMen ?? 0}</td>
										<td>
											<strong>{totalWorkforce}</strong>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					{/* Card: Pay gap */}
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
							<p className={`fr-mb-0 ${common.mentionGrey}`}>
								Aucune donnée renseignée.
							</p>
						)}
					</div>

					{/* Card: Variable pay */}
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
												<p
													className={`fr-text--xs fr-mb-0 ${common.mentionGrey}`}
												>
													Femmes
												</p>
												<strong>
													{step3Data.indicatorEWomen
														? `${step3Data.indicatorEWomen} %`
														: "-"}
												</strong>
											</div>
											<div className={stepStyles.flex1}>
												<p
													className={`fr-text--xs fr-mb-0 ${common.mentionGrey}`}
												>
													Hommes
												</p>
												<strong>
													{step3Data.indicatorEMen
														? `${step3Data.indicatorEMen} %`
														: "-"}
												</strong>
											</div>
										</div>
									</div>
									<div className={stepStyles.verticalSeparator} />
									<div className={stepStyles.column} />
								</div>
							</>
						) : (
							<p className={`fr-mb-0 ${common.mentionGrey}`}>
								Aucune donnée renseignée.
							</p>
						)}
					</div>

					{/* Card: Quartile distribution */}
					<div className={stepStyles.card}>
						<CardTitle>
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
							<p className={`fr-mb-0 ${common.mentionGrey}`}>
								Aucune donnée renseignée.
							</p>
						)}
					</div>
				</div>

				{/* Section: Indicators by category */}
				<h2 className="fr-h6 fr-mb-0">Indicateurs par catégorie de salariés</h2>

				<div className={stepStyles.card}>
					<CardTitle>
						Écart de rémunération par catégories de salariés
					</CardTitle>
					{step5Parsed.length > 0 ? (
						step5Parsed.map((cat) => (
							<div key={cat.index}>
								<p className="fr-text--bold fr-mb-0">{cat.name}</p>
								<div className={stepStyles.sideBySide}>
									<GapColumn
										columns={[
											{ label: "Salaire de base", gap: cat.annualBaseGap },
											{
												label: "Composantes variables",
												gap: cat.annualVariableGap,
											},
										]}
										title="Annuelle brute"
									/>
									<div className={stepStyles.verticalSeparator} />
									<GapColumn
										columns={[
											{ label: "Salaire de base", gap: cat.hourlyBaseGap },
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
						<EmptyDataNotice />
					)}
				</div>

				{/* Return button */}
				<Link className="fr-btn fr-btn--primary" href="/mon-espace">
					Retour à Mon Espace
				</Link>
			</div>

			{/* ResourceBanner outside the narrow column (rendered after the container content) */}
			<ResourceBanner />
		</>
	);
}

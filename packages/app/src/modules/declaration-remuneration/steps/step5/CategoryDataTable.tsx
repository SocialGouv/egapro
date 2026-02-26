"use client";

import {
	computeGap,
	computeTotal,
	formatGapCompact,
	formatTotal,
} from "../../shared/gapUtils";
import common from "../../shared/common.module.scss";
import stepStyles from "../Step5EmployeeCategories.module.scss";
import type { EmployeeCategory } from "./categorySerializer";

type Props = {
	category: EmployeeCategory;
	categoryIndex: number;
	onPositiveNumberChange: (
		index: number,
		field: keyof EmployeeCategory,
		isInteger: boolean,
	) => (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function CategoryDataTable({
	category: cat,
	categoryIndex: catIndex,
	onPositiveNumberChange: pos,
}: Props) {
	const annualTotalWomen = computeTotal(
		cat.annualBaseWomen,
		cat.annualVariableWomen,
	);
	const annualTotalMen = computeTotal(cat.annualBaseMen, cat.annualVariableMen);
	const hourlyTotalWomen = computeTotal(
		cat.hourlyBaseWomen,
		cat.hourlyVariableWomen,
	);
	const hourlyTotalMen = computeTotal(cat.hourlyBaseMen, cat.hourlyVariableMen);

	const annualTotalGap =
		annualTotalWomen !== null && annualTotalMen !== null
			? computeGap(annualTotalWomen.toString(), annualTotalMen.toString())
			: null;

	const hourlyTotalGap =
		hourlyTotalWomen !== null && hourlyTotalMen !== null
			? computeGap(hourlyTotalWomen.toString(), hourlyTotalMen.toString())
			: null;

	const id = (suffix: string) => `cat-${catIndex}-${suffix}`;

	return (
		<div className="fr-table fr-table--no-caption fr-mb-0">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption>Données catégorie {catIndex + 1}</caption>
							<thead>
								<tr>
									<th className={stepStyles.nameColumnHeader} scope="col">
										{/* row label */}
									</th>
									<th scope="col">Femmes</th>
									<th scope="col">Hommes</th>
									<th scope="col">
										<strong>Écart</strong>
										<br />
										<span className={common.fontRegular}>
											Seuil réglementaire : 5%
										</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{/* Section: Nombre de salariés */}
								<tr>
									<td className={stepStyles.sectionHeader} colSpan={4}>
										<strong>Nombre de salariés [Nombre total]</strong>
									</td>
								</tr>
								<tr>
									<td>Effectif physique</td>
									<td>
										<div className={stepStyles.inputCell}>
											<input
												aria-label={`Effectif femmes, catégorie ${catIndex + 1}`}
												className={`fr-input ${stepStyles.compactInput}`}
												id={id("women-count")}
												min="0"
												onChange={pos(catIndex, "womenCount", true)}
												step="1"
												type="number"
												value={cat.womenCount}
											/>
											<span className="fr-text--sm">nb</span>
										</div>
									</td>
									<td>
										<div className={stepStyles.inputCell}>
											<input
												aria-label={`Effectif hommes, catégorie ${catIndex + 1}`}
												className={`fr-input ${stepStyles.compactInput}`}
												id={id("men-count")}
												min="0"
												onChange={pos(catIndex, "menCount", true)}
												step="1"
												type="number"
												value={cat.menCount}
											/>
											<span className="fr-text--sm">nb</span>
										</div>
									</td>
									<td>
										{formatGapCompact(computeGap(cat.womenCount, cat.menCount))}{" "}
										%
									</td>
								</tr>

								{/* Section: Rémunération annuelle brute */}
								<tr>
									<td className={stepStyles.sectionHeader} colSpan={4}>
										<strong>Rémunération annuelle brute</strong>
									</td>
								</tr>
								<tr>
									<td>Salaire de base</td>
									<td>
										<div className={stepStyles.inputCell}>
											<input
												aria-label={`Salaire de base annuel femmes, catégorie ${catIndex + 1}`}
												className={`fr-input ${stepStyles.compactInput}`}
												id={id("annual-base-women")}
												min="0"
												onChange={pos(catIndex, "annualBaseWomen", false)}
												step="any"
												type="number"
												value={cat.annualBaseWomen}
											/>
											<span className="fr-text--sm">€</span>
										</div>
									</td>
									<td>
										<div className={stepStyles.inputCell}>
											<input
												aria-label={`Salaire de base annuel hommes, catégorie ${catIndex + 1}`}
												className={`fr-input ${stepStyles.compactInput}`}
												id={id("annual-base-men")}
												min="0"
												onChange={pos(catIndex, "annualBaseMen", false)}
												step="any"
												type="number"
												value={cat.annualBaseMen}
											/>
											<span className="fr-text--sm">€</span>
										</div>
									</td>
									<td>
										{formatGapCompact(
											computeGap(cat.annualBaseWomen, cat.annualBaseMen),
										)}{" "}
										%
									</td>
								</tr>
								<tr>
									<td>
										Composantes variables
										<br />
										ou complémentaires
									</td>
									<td>
										<div className={stepStyles.inputCell}>
											<input
												aria-label={`Composantes variables annuelles femmes, catégorie ${catIndex + 1}`}
												className={`fr-input ${stepStyles.compactInput}`}
												id={id("annual-variable-women")}
												min="0"
												onChange={pos(catIndex, "annualVariableWomen", false)}
												step="any"
												type="number"
												value={cat.annualVariableWomen}
											/>
											<span className="fr-text--sm">€</span>
										</div>
									</td>
									<td>
										<div className={stepStyles.inputCell}>
											<input
												aria-label={`Composantes variables annuelles hommes, catégorie ${catIndex + 1}`}
												className={`fr-input ${stepStyles.compactInput}`}
												id={id("annual-variable-men")}
												min="0"
												onChange={pos(catIndex, "annualVariableMen", false)}
												step="any"
												type="number"
												value={cat.annualVariableMen}
											/>
											<span className="fr-text--sm">€</span>
										</div>
									</td>
									<td>
										{formatGapCompact(
											computeGap(
												cat.annualVariableWomen,
												cat.annualVariableMen,
											),
										)}{" "}
										%
									</td>
								</tr>
								{/* Total annuel */}
								<tr>
									<td className={stepStyles.sectionHeader} colSpan={4}>
										<strong>Total</strong>
									</td>
								</tr>
								<tr>
									<td>{/* empty label */}</td>
									<td>{formatTotal(annualTotalWomen, "€")}</td>
									<td>{formatTotal(annualTotalMen, "€")}</td>
									<td>{formatGapCompact(annualTotalGap)} %</td>
								</tr>

								{/* Section: Rémunération horaire brute */}
								<tr>
									<td className={stepStyles.sectionHeader} colSpan={4}>
										<strong>Rémunération horaire brute</strong>
									</td>
								</tr>
								<tr>
									<td>Salaire de base</td>
									<td>
										<div className={stepStyles.inputCell}>
											<input
												aria-label={`Salaire de base horaire femmes, catégorie ${catIndex + 1}`}
												className={`fr-input ${stepStyles.compactInput}`}
												id={id("hourly-base-women")}
												min="0"
												onChange={pos(catIndex, "hourlyBaseWomen", false)}
												step="any"
												type="number"
												value={cat.hourlyBaseWomen}
											/>
											<span className="fr-text--sm">€</span>
										</div>
									</td>
									<td>
										<div className={stepStyles.inputCell}>
											<input
												aria-label={`Salaire de base horaire hommes, catégorie ${catIndex + 1}`}
												className={`fr-input ${stepStyles.compactInput}`}
												id={id("hourly-base-men")}
												min="0"
												onChange={pos(catIndex, "hourlyBaseMen", false)}
												step="any"
												type="number"
												value={cat.hourlyBaseMen}
											/>
											<span className="fr-text--sm">€</span>
										</div>
									</td>
									<td>
										{formatGapCompact(
											computeGap(cat.hourlyBaseWomen, cat.hourlyBaseMen),
										)}{" "}
										%
									</td>
								</tr>
								<tr>
									<td>
										Composantes variables
										<br />
										ou complémentaires
									</td>
									<td>
										<div className={stepStyles.inputCell}>
											<input
												aria-label={`Composantes variables horaires femmes, catégorie ${catIndex + 1}`}
												className={`fr-input ${stepStyles.compactInput}`}
												id={id("hourly-variable-women")}
												min="0"
												onChange={pos(catIndex, "hourlyVariableWomen", false)}
												step="any"
												type="number"
												value={cat.hourlyVariableWomen}
											/>
											<span className="fr-text--sm">€</span>
										</div>
									</td>
									<td>
										<div className={stepStyles.inputCell}>
											<input
												aria-label={`Composantes variables horaires hommes, catégorie ${catIndex + 1}`}
												className={`fr-input ${stepStyles.compactInput}`}
												id={id("hourly-variable-men")}
												min="0"
												onChange={pos(catIndex, "hourlyVariableMen", false)}
												step="any"
												type="number"
												value={cat.hourlyVariableMen}
											/>
											<span className="fr-text--sm">€</span>
										</div>
									</td>
									<td>
										{formatGapCompact(
											computeGap(
												cat.hourlyVariableWomen,
												cat.hourlyVariableMen,
											),
										)}{" "}
										%
									</td>
								</tr>
								{/* Total horaire */}
								<tr>
									<td className={stepStyles.sectionHeader} colSpan={4}>
										<strong>Total</strong>
									</td>
								</tr>
								<tr>
									<td>{/* empty label */}</td>
									<td>{formatTotal(hourlyTotalWomen, "€")}</td>
									<td>{formatTotal(hourlyTotalMen, "€")}</td>
									<td>{formatGapCompact(hourlyTotalGap)} %</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

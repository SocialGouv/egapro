"use client";

import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import {
	computeGap,
	computeTotal,
	displayDecimal,
	formatTotal,
} from "~/modules/declaration-remuneration/shared/gapUtils";
import stepStyles from "../Step5EmployeeCategories.module.scss";
import { GapBadge } from "../step6/GapBadge";
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
									<td />
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
												inputMode="decimal"
												onChange={pos(catIndex, "annualBaseWomen", false)}
												type="text"
												value={displayDecimal(cat.annualBaseWomen)}
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
												inputMode="decimal"
												onChange={pos(catIndex, "annualBaseMen", false)}
												type="text"
												value={displayDecimal(cat.annualBaseMen)}
											/>
											<span className="fr-text--sm">€</span>
										</div>
									</td>
									<td>
										<GapBadge
											gap={computeGap(cat.annualBaseWomen, cat.annualBaseMen)}
										/>
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
												inputMode="decimal"
												onChange={pos(catIndex, "annualVariableWomen", false)}
												type="text"
												value={displayDecimal(cat.annualVariableWomen)}
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
												inputMode="decimal"
												onChange={pos(catIndex, "annualVariableMen", false)}
												type="text"
												value={displayDecimal(cat.annualVariableMen)}
											/>
											<span className="fr-text--sm">€</span>
										</div>
									</td>
									<td>
										<GapBadge
											gap={computeGap(
												cat.annualVariableWomen,
												cat.annualVariableMen,
											)}
										/>
									</td>
								</tr>
								{/* Total annuel */}
								<tr>
									<td className={stepStyles.sectionHeader}>
										<strong>Total</strong>
									</td>
									<td>{formatTotal(annualTotalWomen, "€")}</td>
									<td>{formatTotal(annualTotalMen, "€")}</td>
									<td>
										<GapBadge gap={annualTotalGap} />
									</td>
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
												inputMode="decimal"
												onChange={pos(catIndex, "hourlyBaseWomen", false)}
												type="text"
												value={displayDecimal(cat.hourlyBaseWomen)}
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
												inputMode="decimal"
												onChange={pos(catIndex, "hourlyBaseMen", false)}
												type="text"
												value={displayDecimal(cat.hourlyBaseMen)}
											/>
											<span className="fr-text--sm">€</span>
										</div>
									</td>
									<td>
										<GapBadge
											gap={computeGap(cat.hourlyBaseWomen, cat.hourlyBaseMen)}
										/>
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
												inputMode="decimal"
												onChange={pos(catIndex, "hourlyVariableWomen", false)}
												type="text"
												value={displayDecimal(cat.hourlyVariableWomen)}
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
												inputMode="decimal"
												onChange={pos(catIndex, "hourlyVariableMen", false)}
												type="text"
												value={displayDecimal(cat.hourlyVariableMen)}
											/>
											<span className="fr-text--sm">€</span>
										</div>
									</td>
									<td>
										<GapBadge
											gap={computeGap(
												cat.hourlyVariableWomen,
												cat.hourlyVariableMen,
											)}
										/>
									</td>
								</tr>
								{/* Total horaire */}
								<tr>
									<td className={stepStyles.sectionHeader}>
										<strong>Total</strong>
									</td>
									<td>{formatTotal(hourlyTotalWomen, "€")}</td>
									<td>{formatTotal(hourlyTotalMen, "€")}</td>
									<td>
										<GapBadge gap={hourlyTotalGap} />
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

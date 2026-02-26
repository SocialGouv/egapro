"use client";

import common from "../../shared/common.module.scss";
import { TooltipButton } from "../../shared/TooltipButton";
import { computePercentage, formatCurrency } from "../../shared/gapUtils";
import type { StepCategoryData } from "../../types";
import stepStyles from "../Step4QuartileDistribution.module.scss";

const QUARTILE_NAMES = [
	"1er quartile",
	"2e quartile",
	"3e quartile",
	"4e quartile",
] as const;

type Props = {
	title: string;
	tableType: "annual" | "hourly";
	categories: StepCategoryData[];
	onEditRemuneration: () => void;
	onEditWomenCount: () => void;
	onEditMenCount: () => void;
};

export function QuartileTable({
	title,
	tableType,
	categories,
	onEditRemuneration,
	onEditWomenCount,
	onEditMenCount,
}: Props) {
	const totalWomen = categories.reduce(
		(sum, c) => sum + (c.womenCount ?? 0),
		0,
	);
	const totalMen = categories.reduce((sum, c) => sum + (c.menCount ?? 0), 0);
	const totalAll = totalWomen + totalMen;

	return (
		<div className={stepStyles.tableWrapper}>
			<h3 className="fr-h5 fr-mb-0">{title}</h3>
			<div className={stepStyles.tableSection}>
				<div className="fr-table fr-table--no-caption fr-mb-0">
					<div className="fr-table__wrapper">
						<div className="fr-table__container">
							<div className="fr-table__content">
								<table>
									<caption>{title}</caption>
									<thead>
										<tr>
											<th scope="col">{/* row label */}</th>
											{QUARTILE_NAMES.map((name) => (
												<th key={name} scope="col">
													{name}
												</th>
											))}
											<th scope="col">Tous les salariés</th>
											<th scope="col">{/* actions */}</th>
										</tr>
									</thead>
									<tbody>
										{/* Row 1: Remuneration */}
										<tr>
											<td>
												<strong>Rémunération brute</strong>
											</td>
											{categories.map((c) => (
												<td key={c.name}>{formatCurrency(c.womenValue)}</td>
											))}
											<td>-</td>
											<td>
												<button
													aria-label={`Modifier la rémunération ${tableType === "annual" ? "annuelle" : "horaire"}`}
													className="fr-btn fr-btn--tertiary-no-outline fr-icon-edit-line fr-btn--sm"
													onClick={onEditRemuneration}
													type="button"
												/>
											</td>
										</tr>
										{/* Row 2: Women count */}
										<tr>
											<td>
												<strong>Nombre de femmes</strong>
											</td>
											{categories.map((c) => (
												<td key={c.name}>{c.womenCount ?? "-"}</td>
											))}
											<td>{totalWomen || "-"}</td>
											<td>
												<button
													aria-label={`Modifier le nombre de femmes (${tableType === "annual" ? "annuel" : "horaire"})`}
													className="fr-btn fr-btn--tertiary-no-outline fr-icon-edit-line fr-btn--sm"
													onClick={onEditWomenCount}
													type="button"
												/>
											</td>
										</tr>
										{/* Row 3: Women percentage */}
										<tr>
											<td>
												<strong>Pourcentage de femmes</strong>
											</td>
											{categories.map((c) => {
												const total = (c.womenCount ?? 0) + (c.menCount ?? 0);
												return (
													<td key={c.name}>
														{computePercentage(c.womenCount ?? 0, total)}
													</td>
												);
											})}
											<td>{computePercentage(totalWomen, totalAll)}</td>
											<td>{/* no action for computed row */}</td>
										</tr>
										{/* Row 4: Men count */}
										<tr>
											<td>
												<strong>Nombre d&apos;hommes</strong>
											</td>
											{categories.map((c) => (
												<td key={c.name}>{c.menCount ?? "-"}</td>
											))}
											<td>{totalMen || "-"}</td>
											<td>
												<button
													aria-label={`Modifier le nombre d'hommes (${tableType === "annual" ? "annuel" : "horaire"})`}
													className="fr-btn fr-btn--tertiary-no-outline fr-icon-edit-line fr-btn--sm"
													onClick={onEditMenCount}
													type="button"
												/>
											</td>
										</tr>
										{/* Row 5: Men percentage */}
										<tr>
											<td>
												<strong>Pourcentage d&apos;hommes</strong>
											</td>
											{categories.map((c) => {
												const total = (c.womenCount ?? 0) + (c.menCount ?? 0);
												return (
													<td key={c.name}>
														{computePercentage(c.menCount ?? 0, total)}
													</td>
												);
											})}
											<td>{computePercentage(totalMen, totalAll)}</td>
											<td>{/* no action for computed row */}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>

				{/* Source text */}
				<p className={`fr-text--sm fr-mb-0 ${common.mentionGrey}`}>
					Source : déclarations sociales nominatives mise à jour le 27/01/2026.
					<TooltipButton
						id={`tooltip-source-step4-${tableType}`}
						label="Information sur la source"
					/>
				</p>
			</div>
		</div>
	);
}

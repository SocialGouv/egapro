"use client";

import type { QuartileTuple } from "~/modules/declaration-remuneration/types";
import { computePercentage, sumQuartileWorkforce } from "~/modules/domain";
import stepStyles from "../Step4QuartileDistribution.module.scss";
import { QuartileTableRow } from "./QuartileTableRow";

type Field = "threshold" | "women" | "men";

export type QuartileFieldErrors = {
	threshold?: string;
	women?: string;
	men?: string;
};

type Props = {
	title: string;
	tableType: "annual" | "hourly";
	quartiles: QuartileTuple;
	/** Display string for each quartile lower bound (Q1..Q4). */
	mins: [string, string, string, string];
	errors: [
		QuartileFieldErrors,
		QuartileFieldErrors,
		QuartileFieldErrors,
		QuartileFieldErrors,
	];
	readingNote?: React.ReactNode;
	sourceNote?: React.ReactNode;
	onQuartileChange: (index: number, field: Field, value: string) => void;
	disabled?: boolean;
};

export function QuartileTable({
	title,
	tableType,
	quartiles,
	mins,
	errors,
	readingNote,
	sourceNote,
	onQuartileChange,
	disabled = false,
}: Props) {
	const {
		women: totalWomen,
		men: totalMen,
		total: totalAll,
	} = sumQuartileWorkforce(quartiles);
	const trancheSuffix =
		tableType === "annual" ? "annuelle brute" : "horaire brute";

	return (
		<div className={stepStyles.tableWrapper}>
			<h3 className="fr-h6 fr-mb-0">{title}</h3>
			<div className={stepStyles.tableSection}>
				{readingNote}
				<div
					className={`fr-table fr-table--no-scroll fr-table--no-caption fr-mt-0 fr-mb-0 ${stepStyles.quartileTable}`}
				>
					<div className="fr-table__wrapper">
						<div className="fr-table__container">
							<div className="fr-table__content">
								<table>
									{/* fr-table--no-caption keeps the caption in the a11y tree (sr-only)
									    without reserving the DSFR --table-offset top space. */}
									<caption>{title}</caption>
									<colgroup>
										<col className={stepStyles.colRowLabel} />
										<col className={stepStyles.colMin} />
										<col className={stepStyles.colMax} />
										<col className={stepStyles.colCount} />
										<col className={stepStyles.colCount} />
										<col className={stepStyles.colPercent} />
										<col className={stepStyles.colPercent} />
									</colgroup>
									<thead>
										<tr>
											<th scope="col">{/* row label */}</th>
											<th colSpan={2} scope="col">
												Tranche de rémunération
												<br />
												{trancheSuffix}
											</th>
											<th scope="col">
												Nombre
												<br />
												de femmes
											</th>
											<th scope="col">
												Nombre
												<br />
												d&apos;hommes
											</th>
											<th scope="col">
												Pourcentage
												<br />
												de femmes
											</th>
											<th scope="col">
												Pourcentage
												<br />
												d&apos;hommes
											</th>
										</tr>
									</thead>
									<tbody>
										{[0, 1, 2, 3].map((i) => (
											<QuartileTableRow
												disabled={disabled}
												errors={errors[i] ?? {}}
												index={i}
												key={`${tableType}-q${i + 1}`}
												min={mins[i] ?? ""}
												onQuartileChange={onQuartileChange}
												quartile={quartiles[i] ?? { threshold: undefined }}
												tableType={tableType}
											/>
										))}
										<tr>
											<th scope="row">Tous les salariés</th>
											<td className={stepStyles.minCell} />
											<td className={stepStyles.maxCell} />
											<td
												className={stepStyles.numericCell}
												data-mobile-label="Nombre de femmes"
											>
												<strong>{totalAll > 0 ? totalWomen : "-"}</strong>
											</td>
											<td
												className={stepStyles.numericCell}
												data-mobile-label="Nombre d'hommes"
											>
												<strong>{totalAll > 0 ? totalMen : "-"}</strong>
											</td>
											<td
												className={stepStyles.numericCell}
												data-mobile-label="Pourcentage de femmes"
											>
												<strong>
													{computePercentage(totalWomen, totalAll)}
												</strong>
											</td>
											<td
												className={stepStyles.numericCell}
												data-mobile-label="Pourcentage d'hommes"
											>
												<strong>{computePercentage(totalMen, totalAll)}</strong>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>

				{sourceNote}
			</div>
		</div>
	);
}

"use client";

import { TableTitle } from "~/modules/declaration-remuneration/shared/TableTitle";
import type { QuartileTuple } from "~/modules/declaration-remuneration/types";
import { computePercentage, sumQuartileWorkforce } from "~/modules/domain";
import stepStyles from "../Step4QuartileDistribution.module.scss";
import { QuartileTableRow, TRANCHE_AMOUNTS_HEADER } from "./QuartileTableRow";

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
	readingNote: string | null;
	tooltipId: string;
	sourceNote?: React.ReactNode;
	/** Rendered below sourceNote — the per-table coherence error alert. */
	errorNote?: React.ReactNode;
	onQuartileChange: (index: number, field: Field, value: string) => void;
	disabled?: boolean;
	readOnly?: boolean;
	/** Reference headcount for this table (annual or hourly), when known. */
	referenceWomen?: number;
	referenceMen?: number;
};

export function QuartileTable({
	title,
	tableType,
	quartiles,
	mins,
	errors,
	readingNote,
	tooltipId,
	sourceNote,
	errorNote,
	onQuartileChange,
	disabled = false,
	readOnly = false,
	referenceWomen,
	referenceMen,
}: Props) {
	const {
		women: totalWomen,
		men: totalMen,
		total: totalAll,
	} = sumQuartileWorkforce(quartiles);
	const trancheSuffix =
		tableType === "annual"
			? "de rémunération annuelle brut"
			: "de rémunération horaire brut";

	return (
		<div className={stepStyles.tableWrapper}>
			<TableTitle
				level="h3"
				readingNote={readingNote}
				title={title}
				tooltipId={tooltipId}
			/>
			<div className={stepStyles.tableSection}>
				<div
					className={`fr-table fr-table--bordered fr-table--no-scroll fr-table--no-caption fr-mt-0 fr-mb-0 ${stepStyles.quartileTable}`}
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
											<th scope="col">
												<span className="fr-sr-only">Quartile</span>
											</th>
											<th colSpan={2} scope="col">
												{TRANCHE_AMOUNTS_HEADER}
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
												readOnly={readOnly}
												tableType={tableType}
											/>
										))}
										<tr>
											<th scope="row">Tous les salariés</th>
											<td className={stepStyles.minCell}>
												<span className="fr-sr-only">Non applicable</span>
											</td>
											<td className={stepStyles.maxCell}>
												<span className="fr-sr-only">Non applicable</span>
											</td>
											<td
												className={stepStyles.numericCell}
												data-mobile-label="Nombre de femmes"
											>
												<strong>{totalAll > 0 ? totalWomen : "-"}</strong>
												{referenceWomen !== undefined && (
													<span className="fr-hint-text">
														Référence&nbsp;: {referenceWomen}
													</span>
												)}
											</td>
											<td
												className={stepStyles.numericCell}
												data-mobile-label="Nombre d'hommes"
											>
												<strong>{totalAll > 0 ? totalMen : "-"}</strong>
												{referenceMen !== undefined && (
													<span className="fr-hint-text">
														Référence&nbsp;: {referenceMen}
													</span>
												)}
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
				{errorNote}
			</div>
		</div>
	);
}

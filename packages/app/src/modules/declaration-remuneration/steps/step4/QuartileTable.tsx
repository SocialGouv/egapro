"use client";

import { QUARTILE_NAMES } from "~/modules/declaration-remuneration/shared/constants";
import type { QuartileData } from "~/modules/declaration-remuneration/types";
import { computePercentage, displayDecimal } from "~/modules/domain";
import stepStyles from "../Step4QuartileDistribution.module.scss";

type Props = {
	title: string;
	tableType: "annual" | "hourly";
	quartiles: QuartileData[];
	maxWomen?: number;
	maxMen?: number;
	validationError: string | null;
	readingNote?: React.ReactNode;
	sourceNote?: React.ReactNode;
	onQuartileChange: (
		index: number,
		field: "threshold" | "women" | "men",
		value: string,
	) => void;
};

/** Format ordinal text like "1er quartile" → 1<sup>er</sup> quartile */
function OrdinalLabel({ text }: { text: string }) {
	const match = text.match(/^(\d+)(er|e)\s(.+)$/);
	if (!match) return <>{text}</>;
	const [, num, suffix, rest] = match;
	return (
		<>
			{num}
			<sup>{suffix}</sup> {rest}
		</>
	);
}

export function QuartileTable({
	title,
	tableType,
	quartiles,
	maxWomen,
	maxMen,
	validationError,
	readingNote,
	sourceNote,
	onQuartileChange,
}: Props) {
	const totalWomen = quartiles.reduce((sum, q) => sum + (q.women ?? 0), 0);
	const totalMen = quartiles.reduce((sum, q) => sum + (q.men ?? 0), 0);
	const totalAll = totalWomen + totalMen;

	return (
		<div className={stepStyles.tableWrapper}>
			<h3 className="fr-h5 fr-mb-0">{title}</h3>
			<div className={stepStyles.tableSection}>
				{readingNote}
				<div
					className={`fr-table fr-table--no-caption fr-mt-0 fr-mb-0 ${stepStyles.quartileTable}`}
				>
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
													<OrdinalLabel text={name} />
												</th>
											))}
											<th scope="col">
												Tous
												<br />
												les salariés
											</th>
										</tr>
									</thead>
									<tbody>
										{/* Row 1: Remuneration */}
										<tr>
											<td>
												Rémunération
												<br />
												{tableType === "annual"
													? "annuelle brute"
													: "horaire brute"}
											</td>
											{quartiles.map((q, i) => (
												<td key={QUARTILE_NAMES[i]}>
													<span className={stepStyles.inputWithUnit}>
														<input
															aria-label={`Rémunération brute ${QUARTILE_NAMES[i]}`}
															className="fr-input"
															inputMode="decimal"
															onChange={(e) =>
																onQuartileChange(i, "threshold", e.target.value)
															}
															type="text"
															value={displayDecimal(q.threshold ?? "")}
														/>
														<span aria-hidden="true">€</span>
													</span>
												</td>
											))}
											<td>-</td>
										</tr>
										{/* Row 2: Women count */}
										<tr>
											<td>
												Nombre
												<br />
												de femmes
											</td>
											{quartiles.map((q, i) => (
												<td key={QUARTILE_NAMES[i]}>
													<input
														aria-label={`Nombre de femmes ${QUARTILE_NAMES[i]}`}
														className="fr-input"
														inputMode="numeric"
														onChange={(e) =>
															onQuartileChange(i, "women", e.target.value)
														}
														pattern="[0-9]*"
														type="text"
														value={q.women ?? ""}
													/>
												</td>
											))}
											<td>{totalAll > 0 ? totalWomen : "-"}</td>
										</tr>
										{/* Row 3: Women percentage */}
										<tr>
											<td>
												<strong>
													Pourcentage
													<br />
													de femmes
												</strong>
											</td>
											{quartiles.map((q, i) => {
												const total = (q.women ?? 0) + (q.men ?? 0);
												return (
													<td key={QUARTILE_NAMES[i]}>
														<strong>
															{computePercentage(q.women ?? 0, total)}
														</strong>
													</td>
												);
											})}
											<td>
												<strong>
													{computePercentage(totalWomen, totalAll)}
												</strong>
											</td>
										</tr>
										{/* Row 4: Men count */}
										<tr>
											<td>
												Nombre
												<br />
												d&apos;hommes
											</td>
											{quartiles.map((q, i) => (
												<td key={QUARTILE_NAMES[i]}>
													<input
														aria-label={`Nombre d'hommes ${QUARTILE_NAMES[i]}`}
														className="fr-input"
														inputMode="numeric"
														onChange={(e) =>
															onQuartileChange(i, "men", e.target.value)
														}
														pattern="[0-9]*"
														type="text"
														value={q.men ?? ""}
													/>
												</td>
											))}
											<td>{totalAll > 0 ? totalMen : "-"}</td>
										</tr>
										{/* Row 5: Men percentage */}
										<tr>
											<td>
												<strong>
													Pourcentage
													<br />
													d&apos;hommes
												</strong>
											</td>
											{quartiles.map((q, i) => {
												const total = (q.women ?? 0) + (q.men ?? 0);
												return (
													<td key={QUARTILE_NAMES[i]}>
														<strong>
															{computePercentage(q.men ?? 0, total)}
														</strong>
													</td>
												);
											})}
											<td>
												<strong>{computePercentage(totalMen, totalAll)}</strong>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>

				{validationError && (
					<div
						aria-live="polite"
						className="fr-alert fr-alert--error fr-alert--sm"
					>
						<p>{validationError}</p>
					</div>
				)}
				{sourceNote}
			</div>
		</div>
	);
}

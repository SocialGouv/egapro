"use client";

import { QUARTILE_NAMES } from "~/modules/declaration-remuneration/shared/constants";
import type { StepCategoryData } from "~/modules/declaration-remuneration/types";
import { computePercentage, displayDecimal } from "~/modules/domain";
import stepStyles from "../Step4QuartileDistribution.module.scss";

type Props = {
	title: string;
	tableType: "annual" | "hourly";
	categories: StepCategoryData[];
	maxWomen?: number;
	maxMen?: number;
	validationError: string | null;
	readingNote?: React.ReactNode;
	sourceNote?: React.ReactNode;
	onCategoryChange: (
		index: number,
		field: "womenValue" | "womenCount" | "menCount",
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
	categories,
	maxWomen,
	maxMen,
	validationError,
	readingNote,
	sourceNote,
	onCategoryChange,
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
											{categories.map((c, i) => (
												<td key={c.name}>
													<span className={stepStyles.inputWithUnit}>
														<input
															aria-label={`Rémunération brute ${c.name}`}
															className="fr-input"
															inputMode="decimal"
															onChange={(e) =>
																onCategoryChange(
																	i,
																	"womenValue",
																	e.target.value,
																)
															}
															type="text"
															value={displayDecimal(c.womenValue ?? "")}
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
											{categories.map((c, i) => (
												<td key={c.name}>
													<input
														aria-label={`Nombre de femmes ${c.name}`}
														className="fr-input"
														inputMode="numeric"
														onChange={(e) =>
															onCategoryChange(i, "womenCount", e.target.value)
														}
														pattern="[0-9]*"
														type="text"
														value={c.womenCount ?? ""}
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
											{categories.map((c) => {
												const total = (c.womenCount ?? 0) + (c.menCount ?? 0);
												return (
													<td key={c.name}>
														<strong>
															{computePercentage(c.womenCount ?? 0, total)}
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
											{categories.map((c, i) => (
												<td key={c.name}>
													<input
														aria-label={`Nombre d'hommes ${c.name}`}
														className="fr-input"
														inputMode="numeric"
														onChange={(e) =>
															onCategoryChange(i, "menCount", e.target.value)
														}
														pattern="[0-9]*"
														type="text"
														value={c.menCount ?? ""}
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
											{categories.map((c) => {
												const total = (c.womenCount ?? 0) + (c.menCount ?? 0);
												return (
													<td key={c.name}>
														<strong>
															{computePercentage(c.menCount ?? 0, total)}
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

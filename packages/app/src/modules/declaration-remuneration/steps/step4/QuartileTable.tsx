"use client";

import { QUARTILE_NAMES } from "~/modules/declaration-remuneration/shared/constants";
import type {
	QuartileData,
	QuartileTuple,
} from "~/modules/declaration-remuneration/types";
import { computePercentage, displayDecimal } from "~/modules/domain";
import stepStyles from "../Step4QuartileDistribution.module.scss";

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

function fieldId(
	tableType: "annual" | "hourly",
	index: number,
	suffix: "max" | "f" | "h",
) {
	return `step4-${tableType}-q${index + 1}-${suffix}`;
}

function getQuartileSuffix(index: number) {
	return index === 0 ? "er" : "e";
}

const TYPE_LABEL: Record<"annual" | "hourly", string> = {
	annual: "annuel",
	hourly: "horaire",
};

function thresholdAriaLabel(tableType: "annual" | "hourly", index: number) {
	return `Seuil maximum ${index + 1}${getQuartileSuffix(index)} quartile ${TYPE_LABEL[tableType]}`;
}

function womenAriaLabel(tableType: "annual" | "hourly", index: number) {
	return `Nombre de femmes ${index + 1}${getQuartileSuffix(index)} quartile ${TYPE_LABEL[tableType]}`;
}

function menAriaLabel(tableType: "annual" | "hourly", index: number) {
	return `Nombre d'hommes ${index + 1}${getQuartileSuffix(index)} quartile ${TYPE_LABEL[tableType]}`;
}

function pct(q: QuartileData, gender: "women" | "men") {
	const total = (q.women ?? 0) + (q.men ?? 0);
	if (total === 0) return "-";
	return computePercentage(q[gender] ?? 0, total);
}

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
	const totalWomen = quartiles.reduce((sum, q) => sum + (q.women ?? 0), 0);
	const totalMen = quartiles.reduce((sum, q) => sum + (q.men ?? 0), 0);
	const totalAll = totalWomen + totalMen;
	const trancheTitle =
		tableType === "annual"
			? "Tranche de rémunération annuelle brute"
			: "Tranche de rémunération horaire brute";

	return (
		<div className={stepStyles.tableWrapper}>
			<h3 className="fr-h5 fr-mb-0">{title}</h3>
			<div className={stepStyles.tableSection}>
				{readingNote}
				<div
					className={`fr-table fr-table--bordered fr-mt-0 fr-mb-0 ${stepStyles.quartileTable}`}
				>
					<div className="fr-table__wrapper">
						<div className="fr-table__container">
							<div className="fr-table__content">
								<table>
									<caption className="fr-sr-only">{title}</caption>
									<thead>
										<tr>
											<th scope="col">{/* row label */}</th>
											<th colSpan={2} scope="col">
												{trancheTitle}
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
										{quartiles.map((q, i) => {
											const isLast = i === quartiles.length - 1;
											const idMax = fieldId(tableType, i, "max");
											const idF = fieldId(tableType, i, "f");
											const idH = fieldId(tableType, i, "h");
											const cellErrors = errors[i];
											const thresholdErr = cellErrors?.threshold;
											const womenErr = cellErrors?.women;
											const menErr = cellErrors?.men;
											return (
												<tr key={QUARTILE_NAMES[i]}>
													<th scope="row">
														<OrdinalLabel text={QUARTILE_NAMES[i] ?? ""} />
													</th>
													<td className={stepStyles.minCell}>{mins[i]}</td>
													<td>
														{isLast ? (
															<span className={stepStyles.readonlyCell}>
																- €
															</span>
														) : (
															<div
																className={
																	thresholdErr
																		? `fr-input-group fr-input-group--error ${stepStyles.cellInputGroup}`
																		: stepStyles.cellInputGroup
																}
															>
																<span
																	className={`fr-sr-only ${stepStyles.cellLabel}`}
																	id={`${idMax}-label`}
																>
																	{thresholdAriaLabel(tableType, i)}
																</span>
																<span className={stepStyles.inputWithUnit}>
																	<input
																		aria-describedby={
																			thresholdErr
																				? `${idMax}-error`
																				: undefined
																		}
																		aria-invalid={
																			thresholdErr ? "true" : undefined
																		}
																		aria-labelledby={`${idMax}-label`}
																		className="fr-input"
																		disabled={disabled}
																		id={idMax}
																		inputMode="decimal"
																		onChange={(e) =>
																			onQuartileChange(
																				i,
																				"threshold",
																				e.target.value,
																			)
																		}
																		type="text"
																		value={displayDecimal(q.threshold ?? "")}
																	/>
																	<span aria-hidden="true">€</span>
																</span>
																{thresholdErr && (
																	<p
																		className="fr-error-text fr-mt-1v"
																		id={`${idMax}-error`}
																	>
																		{thresholdErr}
																	</p>
																)}
															</div>
														)}
													</td>
													<td>
														<div
															className={
																womenErr
																	? `fr-input-group fr-input-group--error ${stepStyles.cellInputGroup}`
																	: stepStyles.cellInputGroup
															}
														>
															<span
																className={`fr-sr-only ${stepStyles.cellLabel}`}
																id={`${idF}-label`}
															>
																{womenAriaLabel(tableType, i)}
															</span>
															<input
																aria-describedby={
																	womenErr ? `${idF}-error` : undefined
																}
																aria-invalid={womenErr ? "true" : undefined}
																aria-labelledby={`${idF}-label`}
																className="fr-input"
																disabled={disabled}
																id={idF}
																inputMode="numeric"
																onChange={(e) =>
																	onQuartileChange(i, "women", e.target.value)
																}
																pattern="[0-9]*"
																type="text"
																value={q.women ?? ""}
															/>
															{womenErr && (
																<p
																	className="fr-error-text fr-mt-1v"
																	id={`${idF}-error`}
																>
																	{womenErr}
																</p>
															)}
														</div>
													</td>
													<td>
														<div
															className={
																menErr
																	? `fr-input-group fr-input-group--error ${stepStyles.cellInputGroup}`
																	: stepStyles.cellInputGroup
															}
														>
															<span
																className={`fr-sr-only ${stepStyles.cellLabel}`}
																id={`${idH}-label`}
															>
																{menAriaLabel(tableType, i)}
															</span>
															<input
																aria-describedby={
																	menErr ? `${idH}-error` : undefined
																}
																aria-invalid={menErr ? "true" : undefined}
																aria-labelledby={`${idH}-label`}
																className="fr-input"
																disabled={disabled}
																id={idH}
																inputMode="numeric"
																onChange={(e) =>
																	onQuartileChange(i, "men", e.target.value)
																}
																pattern="[0-9]*"
																type="text"
																value={q.men ?? ""}
															/>
															{menErr && (
																<p
																	className="fr-error-text fr-mt-1v"
																	id={`${idH}-error`}
																>
																	{menErr}
																</p>
															)}
														</div>
													</td>
													<td>
														<strong>{pct(q, "women")}</strong>
													</td>
													<td>
														<strong>{pct(q, "men")}</strong>
													</td>
												</tr>
											);
										})}
										<tr>
											<th scope="row">Tous les salariés</th>
											<td className={stepStyles.minCell} />
											<td />
											<td>
												<strong>{totalAll > 0 ? totalWomen : "-"}</strong>
											</td>
											<td>
												<strong>{totalAll > 0 ? totalMen : "-"}</strong>
											</td>
											<td>
												<strong>
													{computePercentage(totalWomen, totalAll)}
												</strong>
											</td>
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

				{sourceNote}
			</div>
		</div>
	);
}

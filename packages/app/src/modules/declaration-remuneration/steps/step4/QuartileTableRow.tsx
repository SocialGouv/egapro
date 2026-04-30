"use client";

import { QUARTILE_NAMES } from "~/modules/declaration-remuneration/shared/constants";
import type { QuartileData } from "~/modules/declaration-remuneration/types";
import { computePercentage, displayDecimal } from "~/modules/domain";
import stepStyles from "../Step4QuartileDistribution.module.scss";
import type { QuartileFieldErrors } from "./QuartileTable";

type Field = "threshold" | "women" | "men";
type TableType = "annual" | "hourly";

const TYPE_LABEL: Record<TableType, string> = {
	annual: "annuel",
	hourly: "horaire",
};

function ordinalSuffix(index: number) {
	return index === 0 ? "er" : "e";
}

function fieldId(
	tableType: TableType,
	index: number,
	suffix: "max" | "f" | "h",
) {
	return `step4-${tableType}-q${index + 1}-${suffix}`;
}

function thresholdAriaLabel(tableType: TableType, index: number) {
	return `Seuil maximum ${index + 1}${ordinalSuffix(index)} quartile ${TYPE_LABEL[tableType]} en euros`;
}

function womenAriaLabel(tableType: TableType, index: number) {
	return `Nombre de femmes ${index + 1}${ordinalSuffix(index)} quartile ${TYPE_LABEL[tableType]}`;
}

function menAriaLabel(tableType: TableType, index: number) {
	return `Nombre d'hommes ${index + 1}${ordinalSuffix(index)} quartile ${TYPE_LABEL[tableType]}`;
}

function pct(q: QuartileData, gender: "women" | "men") {
	const total = (q.women ?? 0) + (q.men ?? 0);
	if (total === 0) return "-";
	return computePercentage(q[gender] ?? 0, total);
}

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

type Props = {
	tableType: TableType;
	index: number;
	quartile: QuartileData;
	min: string;
	errors: QuartileFieldErrors;
	disabled: boolean;
	onQuartileChange: (index: number, field: Field, value: string) => void;
};

export function QuartileTableRow({
	tableType,
	index,
	quartile,
	min,
	errors,
	disabled,
	onQuartileChange,
}: Props) {
	const isLast = index === 3;
	const idMax = fieldId(tableType, index, "max");
	const idF = fieldId(tableType, index, "f");
	const idH = fieldId(tableType, index, "h");
	const thresholdErr = errors.threshold;
	const womenErr = errors.women;
	const menErr = errors.men;

	return (
		<tr>
			<th scope="row">
				<OrdinalLabel text={QUARTILE_NAMES[index] ?? ""} />
			</th>
			<td className={stepStyles.minCell}>{min}</td>
			<td>
				{isLast ? (
					<span className={stepStyles.readonlyCell}>- €</span>
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
							{thresholdAriaLabel(tableType, index)}
						</span>
						<span className={stepStyles.inputWithUnit}>
							<input
								aria-describedby={thresholdErr ? `${idMax}-error` : undefined}
								aria-invalid={thresholdErr ? "true" : undefined}
								aria-labelledby={`${idMax}-label`}
								className="fr-input"
								disabled={disabled}
								id={idMax}
								inputMode="decimal"
								onChange={(e) =>
									onQuartileChange(index, "threshold", e.target.value)
								}
								type="text"
								value={displayDecimal(quartile.threshold ?? "")}
							/>
							<span aria-hidden="true">€</span>
						</span>
						{thresholdErr && (
							<p className="fr-error-text fr-mt-1v" id={`${idMax}-error`}>
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
						{womenAriaLabel(tableType, index)}
					</span>
					<input
						aria-describedby={womenErr ? `${idF}-error` : undefined}
						aria-invalid={womenErr ? "true" : undefined}
						aria-labelledby={`${idF}-label`}
						className="fr-input"
						disabled={disabled}
						id={idF}
						inputMode="numeric"
						onChange={(e) => onQuartileChange(index, "women", e.target.value)}
						pattern="[0-9]*"
						type="text"
						value={quartile.women ?? ""}
					/>
					{womenErr && (
						<p className="fr-error-text fr-mt-1v" id={`${idF}-error`}>
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
						{menAriaLabel(tableType, index)}
					</span>
					<input
						aria-describedby={menErr ? `${idH}-error` : undefined}
						aria-invalid={menErr ? "true" : undefined}
						aria-labelledby={`${idH}-label`}
						className="fr-input"
						disabled={disabled}
						id={idH}
						inputMode="numeric"
						onChange={(e) => onQuartileChange(index, "men", e.target.value)}
						pattern="[0-9]*"
						type="text"
						value={quartile.men ?? ""}
					/>
					{menErr && (
						<p className="fr-error-text fr-mt-1v" id={`${idH}-error`}>
							{menErr}
						</p>
					)}
				</div>
			</td>
			<td>
				<strong>{pct(quartile, "women")}</strong>
			</td>
			<td>
				<strong>{pct(quartile, "men")}</strong>
			</td>
		</tr>
	);
}

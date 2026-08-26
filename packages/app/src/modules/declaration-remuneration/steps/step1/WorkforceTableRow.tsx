"use client";

import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import { computeWorkforceTotal } from "~/modules/domain";
import type { WorkforceField, WorkforceRowDefinition } from "./workforceRows";
import { workforceFieldLabel } from "./workforceRows";

type CellProps = {
	disabled: boolean;
	error: string | undefined;
	id: string;
	label: string;
	onChange: (raw: string) => void;
	readOnly: boolean;
	value: string;
};

function WorkforceCell({
	disabled,
	error,
	id,
	label,
	onChange,
	readOnly,
	value,
}: CellProps) {
	return (
		<td>
			<div
				className={
					error ? "fr-input-group fr-input-group--error" : "fr-input-group"
				}
			>
				<input
					aria-describedby={error ? `${id}-error` : undefined}
					aria-invalid={error ? true : undefined}
					aria-label={label}
					className={
						error
							? `fr-input fr-input--error ${common.numericInput}`
							: `fr-input ${common.numericInput}`
					}
					disabled={disabled}
					inputMode="numeric"
					onChange={(e) => onChange(e.target.value)}
					pattern="[0-9]*"
					readOnly={readOnly}
					type="text"
					value={value}
				/>
				{error && (
					<p className="fr-error-text" id={`${id}-error`}>
						{error}
					</p>
				)}
			</div>
		</td>
	);
}

type Props = {
	disabled: boolean;
	errors: Partial<Record<WorkforceField, string>>;
	onFieldChange: (field: WorkforceField, raw: string) => void;
	raw: Record<WorkforceField, string>;
	readOnly: boolean;
	row: WorkforceRowDefinition;
	values: Record<WorkforceField, number>;
};

export function WorkforceTableRow({
	disabled,
	errors,
	onFieldChange,
	raw,
	readOnly,
	row,
	values,
}: Props) {
	const total = computeWorkforceTotal(
		values[row.womenField],
		values[row.menField],
	);

	return (
		<tr>
			<th scope="row">{row.label}</th>
			<WorkforceCell
				disabled={disabled}
				error={errors[row.womenField]}
				id={`step1-${row.basis}-women`}
				label={workforceFieldLabel(row, "women")}
				onChange={(value) => onFieldChange(row.womenField, value)}
				readOnly={readOnly}
				value={raw[row.womenField]}
			/>
			<WorkforceCell
				disabled={disabled}
				error={errors[row.menField]}
				id={`step1-${row.basis}-men`}
				label={workforceFieldLabel(row, "men")}
				onChange={(value) => onFieldChange(row.menField, value)}
				readOnly={readOnly}
				value={raw[row.menField]}
			/>
			<td className="fr-cell--right">
				<strong>{total}</strong>
			</td>
		</tr>
	);
}

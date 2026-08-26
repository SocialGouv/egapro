"use client";

import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import type { FieldError } from "~/modules/declaration-remuneration/shared/formError/types";
import {
	describedByForField,
	findFieldError,
} from "~/modules/declaration-remuneration/shared/formError/types";
import { computeWorkforceTotal } from "~/modules/domain";
import type { WorkforceField, WorkforceRowDefinition } from "./workforceRows";
import { workforceFieldId, workforceFieldLabel } from "./workforceRows";

type CellProps = {
	disabled: boolean;
	error: FieldError | undefined;
	errorAlertId: string;
	id: string;
	label: string;
	onChange: (raw: string) => void;
	readOnly: boolean;
	value: string;
};

function WorkforceCell({
	disabled,
	error,
	errorAlertId,
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
					aria-describedby={describedByForField(errorAlertId, error)}
					aria-invalid={error ? true : undefined}
					aria-label={label}
					className={
						error
							? `fr-input fr-input--error ${common.numericInput}`
							: `fr-input ${common.numericInput}`
					}
					disabled={disabled}
					id={id}
					inputMode="numeric"
					onChange={(e) => onChange(e.target.value)}
					pattern="[0-9]*"
					readOnly={readOnly}
					type="text"
					value={value}
				/>
			</div>
		</td>
	);
}

type Props = {
	disabled: boolean;
	errorAlertId: string;
	errors: readonly FieldError[];
	onFieldChange: (field: WorkforceField, raw: string) => void;
	raw: Record<WorkforceField, string>;
	readOnly: boolean;
	row: WorkforceRowDefinition;
	values: Record<WorkforceField, number>;
};

export function WorkforceTableRow({
	disabled,
	errorAlertId,
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
	const womenId = workforceFieldId(row, "women");
	const menId = workforceFieldId(row, "men");

	return (
		<tr>
			<th scope="row">{row.label}</th>
			<WorkforceCell
				disabled={disabled}
				error={findFieldError(errors, womenId)}
				errorAlertId={errorAlertId}
				id={womenId}
				label={workforceFieldLabel(row, "women")}
				onChange={(value) => onFieldChange(row.womenField, value)}
				readOnly={readOnly}
				value={raw[row.womenField]}
			/>
			<WorkforceCell
				disabled={disabled}
				error={findFieldError(errors, menId)}
				errorAlertId={errorAlertId}
				id={menId}
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

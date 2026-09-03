"use client";

import { useState } from "react";

import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import type { FieldError } from "~/modules/declaration-remuneration/shared/formError/types";
import {
	describedByForField,
	findFieldError,
} from "~/modules/declaration-remuneration/shared/formError/types";
import { numericInputClassName } from "~/modules/declaration-remuneration/shared/numericInputClassName";
import {
	computeGap,
	computeTotal,
	computeWorkforceTotal,
	displayDecimal,
	formatTotal,
} from "~/modules/domain";
import stepStyles from "../Step5EmployeeCategories.module.scss";
import { workforceFieldLabel } from "../step1/workforceRows";
import { GapBadge } from "../step6/GapBadge";
import type { EmployeeCategory } from "./categorySerializer";
import type { CategoryWorkforceRowDefinition } from "./categoryWorkforceRows";
import { CATEGORY_WORKFORCE_ROWS } from "./categoryWorkforceRows";

type Props = {
	category: EmployeeCategory;
	categoryIndex: number;
	onPositiveNumberChange: (
		index: number,
		field: keyof EmployeeCategory,
		isInteger: boolean,
	) => (e: React.ChangeEvent<HTMLInputElement>) => void;
	onDecimalBlur: (index: number, field: keyof EmployeeCategory) => () => void;
	disabled?: boolean;
	/** Greys out the two remuneration tables only — the headcount cells stay
	 *  operable so a category at 0 can be corrected (#3678). */
	payDisabled?: boolean;
	readOnly?: boolean;
	errorAlertId: string;
	errors: readonly FieldError[];
};

type StringField = {
	[K in keyof EmployeeCategory]: EmployeeCategory[K] extends string ? K : never;
}[keyof EmployeeCategory];

type EuroFields = {
	baseWomen: StringField;
	baseMen: StringField;
	variableWomen: StringField;
	variableMen: StringField;
};

const ANNUAL_FIELDS: EuroFields = {
	baseWomen: "annualBaseWomen",
	baseMen: "annualBaseMen",
	variableWomen: "annualVariableWomen",
	variableMen: "annualVariableMen",
};

const HOURLY_FIELDS: EuroFields = {
	baseWomen: "hourlyBaseWomen",
	baseMen: "hourlyBaseMen",
	variableWomen: "hourlyVariableWomen",
	variableMen: "hourlyVariableMen",
};

const FIELD_ID_SUFFIX: Partial<Record<keyof EmployeeCategory, string>> = {
	annualBaseWomen: "annual-base-women",
	annualBaseMen: "annual-base-men",
	annualVariableWomen: "annual-variable-women",
	annualVariableMen: "annual-variable-men",
	hourlyBaseWomen: "hourly-base-women",
	hourlyBaseMen: "hourly-base-men",
	hourlyVariableWomen: "hourly-variable-women",
	hourlyVariableMen: "hourly-variable-men",
	womenCount: "women-count",
	menCount: "men-count",
	hourlyWomenCount: "hourly-women-count",
	hourlyMenCount: "hourly-men-count",
};

export function categoryDataFieldId(
	categoryIndex: number,
	field: keyof EmployeeCategory,
): string {
	const suffix = FIELD_ID_SUFFIX[field];
	if (!suffix) return `cat-${categoryIndex}`;
	return `cat-${categoryIndex}-${suffix}`;
}

type EuroCellProps = {
	ariaLabel: string;
	id: string;
	disabled: boolean;
	readOnly: boolean;
	value: string;
	onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onFocus: () => void;
	errorAlertId: string;
	errors: readonly FieldError[];
};

function EuroInputCell({
	ariaLabel,
	id,
	disabled,
	readOnly,
	value,
	onBlur,
	onChange,
	onFocus,
	errorAlertId,
	errors,
}: EuroCellProps) {
	const error = findFieldError(errors, id);
	return (
		<td>
			<div className={stepStyles.inputCell}>
				<input
					aria-describedby={describedByForField(errorAlertId, error)}
					aria-invalid={error ? true : undefined}
					aria-label={ariaLabel}
					className={`${numericInputClassName(Boolean(error))} ${stepStyles.compactInput}`}
					data-pay-cell="true"
					disabled={disabled}
					id={id}
					inputMode="decimal"
					onBlur={onBlur}
					onChange={onChange}
					onFocus={onFocus}
					readOnly={readOnly}
					type="text"
					value={displayDecimal(value)}
				/>
				<span className="fr-text--sm">€</span>
			</div>
		</td>
	);
}

function RemunerationHead() {
	return (
		<thead>
			<tr>
				<th scope="col">
					<span className="fr-sr-only">Donnée</span>
				</th>
				<th scope="col">Rémunération des femmes</th>
				<th scope="col">Rémunération des hommes</th>
				<th scope="col">
					<strong>Écart</strong>
					<br />
					<span className={common.fontRegular}>Seuil réglementaire : 5%</span>
				</th>
			</tr>
		</thead>
	);
}

function TableFrame({
	caption,
	children,
}: {
	caption: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={`fr-table fr-table--bordered fr-table--no-caption fr-mt-0 fr-mb-0 ${stepStyles.fixedTable}`}
		>
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption>{caption}</caption>
							{children}
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

type RemunerationTableProps = {
	title: string;
	scope: "annuel" | "horaire";
	fields: EuroFields;
	cat: EmployeeCategory;
	catIndex: number;
	disabled: boolean;
	readOnly: boolean;
	pos: Props["onPositiveNumberChange"];
	blur: Props["onDecimalBlur"];
	idPrefix: string;
	errorAlertId: string;
	errors: readonly FieldError[];
	onPayFocus: () => void;
	onPayBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
};

function RemunerationTable({
	title,
	scope,
	fields,
	cat,
	catIndex,
	disabled,
	readOnly,
	pos,
	blur,
	idPrefix,
	errorAlertId,
	errors,
	onPayFocus,
	onPayBlur,
}: RemunerationTableProps) {
	const cellHandlers = (field: StringField) => ({
		onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
			blur(catIndex, field)();
			onPayBlur(e);
		},
		onChange: pos(catIndex, field, false),
		onFocus: onPayFocus,
	});
	const totalWomen = computeTotal(
		cat[fields.baseWomen],
		cat[fields.variableWomen],
	);
	const totalMen = computeTotal(cat[fields.baseMen], cat[fields.variableMen]);

	const scopeId = scope === "annuel" ? "annual" : "hourly";
	const variableScope = scope === "annuel" ? "annuelles" : "horaires";
	const idFor = (suffix: string) => `${idPrefix}-${scopeId}-${suffix}`;

	return (
		<div className={common.flexColumnGap1}>
			<h3 className="fr-h6 fr-mb-0">{title}</h3>
			<TableFrame
				caption={`Catégorie d'emplois n°${catIndex + 1}${cat.name.trim() ? ` : ${cat.name}` : ""} — ${title}`}
			>
				<colgroup>
					<col className={stepStyles.colLabel} />
					<col className={stepStyles.colData} />
					<col className={stepStyles.colData} />
					<col className={stepStyles.colData} />
				</colgroup>
				<RemunerationHead />
				<tbody>
					<tr className={stepStyles.dataRow}>
						<th scope="row">Salaire de base</th>
						<EuroInputCell
							ariaLabel={`Salaire de base ${scope} femmes, catégorie ${catIndex + 1}`}
							disabled={disabled}
							errorAlertId={errorAlertId}
							errors={errors}
							id={idFor("base-women")}
							{...cellHandlers(fields.baseWomen)}
							readOnly={readOnly}
							value={cat[fields.baseWomen]}
						/>
						<EuroInputCell
							ariaLabel={`Salaire de base ${scope} hommes, catégorie ${catIndex + 1}`}
							disabled={disabled}
							errorAlertId={errorAlertId}
							errors={errors}
							id={idFor("base-men")}
							{...cellHandlers(fields.baseMen)}
							readOnly={readOnly}
							value={cat[fields.baseMen]}
						/>
						<td className={stepStyles.gapCell}>
							<GapBadge
								gap={computeGap(cat[fields.baseWomen], cat[fields.baseMen])}
								layout="cell"
							/>
						</td>
					</tr>
					<tr className={stepStyles.dataRow}>
						<th scope="row">
							Composantes variables
							<br />
							ou complémentaires
						</th>
						<EuroInputCell
							ariaLabel={`Composantes variables ${variableScope} femmes, catégorie ${catIndex + 1}`}
							disabled={disabled}
							errorAlertId={errorAlertId}
							errors={errors}
							id={idFor("variable-women")}
							{...cellHandlers(fields.variableWomen)}
							readOnly={readOnly}
							value={cat[fields.variableWomen]}
						/>
						<EuroInputCell
							ariaLabel={`Composantes variables ${variableScope} hommes, catégorie ${catIndex + 1}`}
							disabled={disabled}
							errorAlertId={errorAlertId}
							errors={errors}
							id={idFor("variable-men")}
							{...cellHandlers(fields.variableMen)}
							readOnly={readOnly}
							value={cat[fields.variableMen]}
						/>
						<td className={stepStyles.gapCell}>
							<GapBadge
								gap={computeGap(
									cat[fields.variableWomen],
									cat[fields.variableMen],
								)}
								layout="cell"
							/>
						</td>
					</tr>
					<tr className={stepStyles.dataRow}>
						<th scope="row">Total</th>
						<td className={stepStyles.totalCell}>
							{formatTotal(totalWomen, "€")}
						</td>
						<td className={stepStyles.totalCell}>
							{formatTotal(totalMen, "€")}
						</td>
						<td className={stepStyles.gapCell}>
							<span className="fr-sr-only">Non applicable</span>
						</td>
					</tr>
				</tbody>
			</TableFrame>
		</div>
	);
}

type WorkforceRowProps = {
	row: CategoryWorkforceRowDefinition;
	cat: EmployeeCategory;
	catIndex: number;
	disabled: boolean;
	readOnly: boolean;
	pos: Props["onPositiveNumberChange"];
};

function CategoryWorkforceRow({
	row,
	cat,
	catIndex,
	disabled,
	readOnly,
	pos,
}: WorkforceRowProps) {
	const women = Number.parseInt(cat[row.womenField], 10);
	const men = Number.parseInt(cat[row.menField], 10);
	const total =
		!Number.isNaN(women) && !Number.isNaN(men)
			? computeWorkforceTotal(women, men)
			: null;

	const countCell = (field: typeof row.womenField, sex: "women" | "men") => (
		<td>
			<input
				aria-label={`${workforceFieldLabel(row.workforceRow, sex)}, catégorie ${catIndex + 1}`}
				className={`fr-input ${common.numericInput}`}
				disabled={disabled}
				id={categoryDataFieldId(catIndex, field)}
				inputMode="numeric"
				onChange={pos(catIndex, field, true)}
				pattern="[0-9]*"
				readOnly={readOnly}
				type="text"
				value={cat[field]}
			/>
		</td>
	);

	return (
		<tr className={stepStyles.dataRow}>
			<th scope="row">{row.workforceRow.label}</th>
			{countCell(row.womenField, "women")}
			{countCell(row.menField, "men")}
			<td className={stepStyles.totalCell}>
				<strong>{total ?? "-"}</strong>
			</td>
		</tr>
	);
}

function isPayCell(node: EventTarget | null): boolean {
	return node instanceof HTMLElement && node.dataset.payCell === "true";
}

export function CategoryDataTable({
	category: cat,
	categoryIndex: catIndex,
	onPositiveNumberChange: pos,
	onDecimalBlur: blur,
	disabled = false,
	payDisabled = false,
	readOnly = false,
	errorAlertId,
	errors,
}: Props) {
	const idPrefix = `cat-${catIndex}`;
	const [isEditingPay, setIsEditingPay] = useState(false);
	// Greying an input that currently holds the focus makes the browser drop
	// that focus to <body>. Erasing the last amount of a category at 0 is the
	// very fix the error message suggests, so the greying waits until the user
	// has left the two tables (WCAG 3.2.2 On Input, 2.4.3 Focus Order).
	const payTablesDisabled = disabled || (payDisabled && !isEditingPay);

	const handlePayBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		// Focus moving to the sibling pay cell must not grey that cell away.
		if (!isPayCell(e.relatedTarget)) setIsEditingPay(false);
	};

	return (
		<div className={common.dataSection}>
			<div className={common.flexColumnGap1}>
				<h3 className="fr-h6 fr-mb-0">
					Nombre de salariés en effectif physique
				</h3>
				<TableFrame
					caption={`Catégorie d'emplois n°${catIndex + 1}${cat.name.trim() ? ` : ${cat.name}` : ""} — Nombre de salariés en effectif physique`}
				>
					<colgroup>
						<col className={stepStyles.colLabel} />
						<col className={stepStyles.colData} />
						<col className={stepStyles.colData} />
						<col className={stepStyles.colData} />
					</colgroup>
					<thead>
						<tr>
							<th scope="col">Nombre de salariés</th>
							<th scope="col">Femmes</th>
							<th scope="col">Hommes</th>
							<th scope="col">Total</th>
						</tr>
					</thead>
					<tbody>
						{CATEGORY_WORKFORCE_ROWS.map((row) => (
							<CategoryWorkforceRow
								cat={cat}
								catIndex={catIndex}
								disabled={disabled}
								key={row.workforceRow.basis}
								pos={pos}
								readOnly={readOnly}
								row={row}
							/>
						))}
					</tbody>
				</TableFrame>
			</div>

			<RemunerationTable
				blur={blur}
				cat={cat}
				catIndex={catIndex}
				disabled={payTablesDisabled}
				errorAlertId={errorAlertId}
				errors={errors}
				fields={ANNUAL_FIELDS}
				idPrefix={idPrefix}
				onPayBlur={handlePayBlur}
				onPayFocus={() => setIsEditingPay(true)}
				pos={pos}
				readOnly={readOnly}
				scope="annuel"
				title="Rémunération annuelle brute moyenne"
			/>

			<RemunerationTable
				blur={blur}
				cat={cat}
				catIndex={catIndex}
				disabled={payTablesDisabled}
				errorAlertId={errorAlertId}
				errors={errors}
				fields={HOURLY_FIELDS}
				idPrefix={idPrefix}
				onPayBlur={handlePayBlur}
				onPayFocus={() => setIsEditingPay(true)}
				pos={pos}
				readOnly={readOnly}
				scope="horaire"
				title="Rémunération horaire brute moyenne"
			/>
		</div>
	);
}

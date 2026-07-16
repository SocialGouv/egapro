"use client";

import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import {
	computeGap,
	computeTotal,
	computeWorkforceTotal,
	displayDecimal,
	formatTotal,
} from "~/modules/domain";
import stepStyles from "../Step5EmployeeCategories.module.scss";
import { GapBadge } from "../step6/GapBadge";
import type { EmployeeCategory } from "./categorySerializer";

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

type EuroCellProps = {
	ariaLabel: string;
	id: string;
	disabled: boolean;
	value: string;
	onBlur: () => void;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function EuroInputCell({
	ariaLabel,
	id,
	disabled,
	value,
	onBlur,
	onChange,
}: EuroCellProps) {
	return (
		<td>
			<div className={stepStyles.inputCell}>
				<input
					aria-label={ariaLabel}
					className={`fr-input ${stepStyles.compactInput} ${common.numericInput}`}
					disabled={disabled}
					id={id}
					inputMode="decimal"
					onBlur={onBlur}
					onChange={onChange}
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
				<th className={stepStyles.nameColumnHeader} scope="col">
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
		<div className="fr-table fr-table--no-caption fr-mt-0 fr-mb-0">
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
	pos: Props["onPositiveNumberChange"];
	blur: Props["onDecimalBlur"];
	idPrefix: string;
};

function RemunerationTable({
	title,
	scope,
	fields,
	cat,
	catIndex,
	disabled,
	pos,
	blur,
	idPrefix,
}: RemunerationTableProps) {
	const totalWomen = computeTotal(
		cat[fields.baseWomen],
		cat[fields.variableWomen],
	);
	const totalMen = computeTotal(cat[fields.baseMen], cat[fields.variableMen]);
	const totalGap =
		totalWomen !== null && totalMen !== null
			? computeGap(totalWomen.toString(), totalMen.toString())
			: null;

	const scopeId = scope === "annuel" ? "annual" : "hourly";
	const variableScope = scope === "annuel" ? "annuelles" : "horaires";
	const idFor = (suffix: string) => `${idPrefix}-${scopeId}-${suffix}`;

	return (
		<div className={common.flexColumnGap1}>
			<h3 className="fr-h6 fr-mb-0">{title}</h3>
			<TableFrame
				caption={`Catégorie d'emplois n°${catIndex + 1}${cat.name.trim() ? ` : ${cat.name}` : ""} — ${title}`}
			>
				<RemunerationHead />
				<tbody>
					<tr className={stepStyles.dataRow}>
						<th scope="row">Salaire de base</th>
						<EuroInputCell
							ariaLabel={`Salaire de base ${scope} femmes, catégorie ${catIndex + 1}`}
							disabled={disabled}
							id={idFor("base-women")}
							onBlur={blur(catIndex, fields.baseWomen)}
							onChange={pos(catIndex, fields.baseWomen, false)}
							value={cat[fields.baseWomen]}
						/>
						<EuroInputCell
							ariaLabel={`Salaire de base ${scope} hommes, catégorie ${catIndex + 1}`}
							disabled={disabled}
							id={idFor("base-men")}
							onBlur={blur(catIndex, fields.baseMen)}
							onChange={pos(catIndex, fields.baseMen, false)}
							value={cat[fields.baseMen]}
						/>
						<td>
							<GapBadge
								gap={computeGap(cat[fields.baseWomen], cat[fields.baseMen])}
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
							id={idFor("variable-women")}
							onBlur={blur(catIndex, fields.variableWomen)}
							onChange={pos(catIndex, fields.variableWomen, false)}
							value={cat[fields.variableWomen]}
						/>
						<EuroInputCell
							ariaLabel={`Composantes variables ${variableScope} hommes, catégorie ${catIndex + 1}`}
							disabled={disabled}
							id={idFor("variable-men")}
							onBlur={blur(catIndex, fields.variableMen)}
							onChange={pos(catIndex, fields.variableMen, false)}
							value={cat[fields.variableMen]}
						/>
						<td>
							<GapBadge
								gap={computeGap(
									cat[fields.variableWomen],
									cat[fields.variableMen],
								)}
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
						<td>
							<GapBadge gap={totalGap} />
						</td>
					</tr>
				</tbody>
			</TableFrame>
		</div>
	);
}

export function CategoryDataTable({
	category: cat,
	categoryIndex: catIndex,
	onPositiveNumberChange: pos,
	onDecimalBlur: blur,
	disabled = false,
}: Props) {
	const womenInt = cat.womenCount ? Number.parseInt(cat.womenCount, 10) : NaN;
	const menInt = cat.menCount ? Number.parseInt(cat.menCount, 10) : NaN;
	const totalEmployees =
		!Number.isNaN(womenInt) && !Number.isNaN(menInt)
			? computeWorkforceTotal(womenInt, menInt)
			: null;

	const idPrefix = `cat-${catIndex}`;

	return (
		<div className={common.dataSection}>
			<div className={common.flexColumnGap1}>
				<h3 aria-atomic="true" aria-live="polite" className="fr-h6 fr-mb-0">
					Total salariés
					{totalEmployees !== null ? ` : ${totalEmployees}` : ""}
				</h3>
				<TableFrame
					caption={`Catégorie d'emplois n°${catIndex + 1}${cat.name.trim() ? ` : ${cat.name}` : ""} — Effectifs physiques`}
				>
					<thead>
						<tr>
							<th className={stepStyles.nameColumnHeader} scope="col">
								<span className="fr-sr-only">Donnée</span>
							</th>
							<th scope="col">Nombre de femmes</th>
							<th scope="col">Nombre d&apos;hommes</th>
						</tr>
					</thead>
					<tbody>
						<tr className={stepStyles.dataRow}>
							<th scope="row">Effectif physique</th>
							<td>
								<div className={stepStyles.inputCell}>
									<input
										aria-label={`Effectif femmes, catégorie ${catIndex + 1}`}
										className={`fr-input ${stepStyles.compactInput} ${common.numericInput}`}
										disabled={disabled}
										id={`${idPrefix}-women-count`}
										inputMode="numeric"
										onChange={pos(catIndex, "womenCount", true)}
										pattern="[0-9]*"
										type="text"
										value={cat.womenCount}
									/>
									<span className="fr-text--sm">nb</span>
								</div>
							</td>
							<td>
								<div className={stepStyles.inputCell}>
									<input
										aria-label={`Effectif hommes, catégorie ${catIndex + 1}`}
										className={`fr-input ${stepStyles.compactInput} ${common.numericInput}`}
										disabled={disabled}
										id={`${idPrefix}-men-count`}
										inputMode="numeric"
										onChange={pos(catIndex, "menCount", true)}
										pattern="[0-9]*"
										type="text"
										value={cat.menCount}
									/>
									<span className="fr-text--sm">nb</span>
								</div>
							</td>
						</tr>
					</tbody>
				</TableFrame>
			</div>

			<RemunerationTable
				blur={blur}
				cat={cat}
				catIndex={catIndex}
				disabled={disabled}
				fields={ANNUAL_FIELDS}
				idPrefix={idPrefix}
				pos={pos}
				scope="annuel"
				title="Rémunération annuelle brute moyenne"
			/>

			<RemunerationTable
				blur={blur}
				cat={cat}
				catIndex={catIndex}
				disabled={disabled}
				fields={HOURLY_FIELDS}
				idPrefix={idPrefix}
				pos={pos}
				scope="horaire"
				title="Rémunération horaire brute moyenne"
			/>
		</div>
	);
}

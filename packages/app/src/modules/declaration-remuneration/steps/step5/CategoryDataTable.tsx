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

type RemunerationSectionProps = {
	sectionLabel: string;
	scope: "annuel" | "horaire";
	fields: EuroFields;
	cat: EmployeeCategory;
	catIndex: number;
	disabled: boolean;
	pos: Props["onPositiveNumberChange"];
	blur: Props["onDecimalBlur"];
	idPrefix: string;
};

function RemunerationSection({
	sectionLabel,
	scope,
	fields,
	cat,
	catIndex,
	disabled,
	pos,
	blur,
	idPrefix,
}: RemunerationSectionProps) {
	const totalWomen = computeTotal(
		cat[fields.baseWomen],
		cat[fields.variableWomen],
	);
	const totalMen = computeTotal(cat[fields.baseMen], cat[fields.variableMen]);
	const totalGap =
		totalWomen !== null && totalMen !== null
			? computeGap(totalWomen.toString(), totalMen.toString())
			: null;

	const idFor = (suffix: string) => `${idPrefix}-${suffix}`;

	return (
		<>
			<tr>
				<td className={stepStyles.sectionHeader} colSpan={4}>
					<strong>{sectionLabel}</strong>
				</td>
			</tr>
			<tr className={stepStyles.dataRow}>
				<td>Salaire de base</td>
				<EuroInputCell
					ariaLabel={`Salaire de base ${scope} femmes, catégorie ${catIndex + 1}`}
					disabled={disabled}
					id={idFor(`${scope === "annuel" ? "annual" : "hourly"}-base-women`)}
					onBlur={blur(catIndex, fields.baseWomen)}
					onChange={pos(catIndex, fields.baseWomen, false)}
					value={cat[fields.baseWomen]}
				/>
				<EuroInputCell
					ariaLabel={`Salaire de base ${scope} hommes, catégorie ${catIndex + 1}`}
					disabled={disabled}
					id={idFor(`${scope === "annuel" ? "annual" : "hourly"}-base-men`)}
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
				<td>
					Composantes variables
					<br />
					ou complémentaires
				</td>
				<EuroInputCell
					ariaLabel={`Composantes variables ${scope === "annuel" ? "annuelles" : "horaires"} femmes, catégorie ${catIndex + 1}`}
					disabled={disabled}
					id={idFor(
						`${scope === "annuel" ? "annual" : "hourly"}-variable-women`,
					)}
					onBlur={blur(catIndex, fields.variableWomen)}
					onChange={pos(catIndex, fields.variableWomen, false)}
					value={cat[fields.variableWomen]}
				/>
				<EuroInputCell
					ariaLabel={`Composantes variables ${scope === "annuel" ? "annuelles" : "horaires"} hommes, catégorie ${catIndex + 1}`}
					disabled={disabled}
					id={idFor(`${scope === "annuel" ? "annual" : "hourly"}-variable-men`)}
					onBlur={blur(catIndex, fields.variableMen)}
					onChange={pos(catIndex, fields.variableMen, false)}
					value={cat[fields.variableMen]}
				/>
				<td>
					<GapBadge
						gap={computeGap(cat[fields.variableWomen], cat[fields.variableMen])}
					/>
				</td>
			</tr>
			<tr className={stepStyles.dataRow}>
				<td>
					<strong>Total</strong>
				</td>
				<td className={stepStyles.totalCell}>{formatTotal(totalWomen, "€")}</td>
				<td className={stepStyles.totalCell}>{formatTotal(totalMen, "€")}</td>
				<td>
					<GapBadge gap={totalGap} />
				</td>
			</tr>
		</>
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
		<div className="fr-table fr-table--no-caption fr-mt-0 fr-mb-0">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption>
								{cat.name.trim()
									? `Catégorie d'emplois n°${catIndex + 1} : ${cat.name}`
									: `Catégorie d'emplois n°${catIndex + 1}`}
							</caption>
							<thead>
								<tr>
									<th className={stepStyles.nameColumnHeader} scope="col">
										{/* row label */}
									</th>
									<th scope="col">Femmes</th>
									<th scope="col">Hommes</th>
									<th scope="col">
										<strong>Écart</strong>
										<br />
										<span className={common.fontRegular}>
											Seuil réglementaire : 5%
										</span>
									</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td className={stepStyles.sectionHeader} colSpan={4}>
										<strong aria-atomic="true" aria-live="polite">
											Total salariés
											{totalEmployees !== null ? ` : ${totalEmployees}` : ""}
										</strong>
									</td>
								</tr>
								<tr className={stepStyles.dataRow}>
									<td>Effectif physique</td>
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
									<td />
								</tr>

								<RemunerationSection
									blur={blur}
									cat={cat}
									catIndex={catIndex}
									disabled={disabled}
									fields={ANNUAL_FIELDS}
									idPrefix={idPrefix}
									pos={pos}
									scope="annuel"
									sectionLabel="Rémunération annuelle brute moyenne"
								/>

								<RemunerationSection
									blur={blur}
									cat={cat}
									catIndex={catIndex}
									disabled={disabled}
									fields={HOURLY_FIELDS}
									idPrefix={idPrefix}
									pos={pos}
									scope="horaire"
									sectionLabel="Rémunération horaire brute moyenne"
								/>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

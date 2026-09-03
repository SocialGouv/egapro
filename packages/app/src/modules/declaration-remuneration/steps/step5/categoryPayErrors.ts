import type { CategoryFormValues } from "~/modules/declaration-remuneration/schemas";
import {
	CATEGORY_PAY_BASES,
	CATEGORY_PAY_FIELDS,
	type PAY_FIELDS_MEN,
	type PAY_FIELDS_WOMEN,
} from "~/modules/declaration-remuneration/schemas";
import type { FieldError } from "~/modules/declaration-remuneration/shared/formError/types";
import { isCategoryPayApplicable } from "~/modules/domain";
import { categoryDataFieldId } from "./CategoryDataTable";
import type { EmployeeCategory } from "./categorySerializer";
import { toCategoryHeadcounts } from "./categorySerializer";

type CategoryPayValues = CategoryFormValues["categories"][number];

/** The pay fields a headcount makes mandatory — its own basis and sex only. */
export function payFieldsForCountField(
	field: keyof EmployeeCategory,
): readonly (keyof EmployeeCategory)[] {
	for (const base of CATEGORY_PAY_BASES) {
		if (field === base.womenCountField) return base.womenPayFields;
		if (field === base.menCountField) return base.menPayFields;
	}
	return [];
}

const PAY_FIELD_LABELS: Record<
	(typeof PAY_FIELDS_WOMEN)[number] | (typeof PAY_FIELDS_MEN)[number],
	string
> = {
	annualBaseWomen: "salaire de base annuel des femmes",
	annualVariableWomen: "composantes variables annuelles des femmes",
	hourlyBaseWomen: "salaire de base horaire des femmes",
	hourlyVariableWomen: "composantes variables horaires des femmes",
	annualBaseMen: "salaire de base annuel des hommes",
	annualVariableMen: "composantes variables annuelles des hommes",
	hourlyBaseMen: "salaire de base horaire des hommes",
	hourlyVariableMen: "composantes variables horaires des hommes",
};

function inconsistentPayErrors(
	category: CategoryPayValues,
	index: number,
): FieldError[] {
	return CATEGORY_PAY_FIELDS.filter(
		(payField) => category[payField].trim() !== "",
	).map((payField) => ({
		fieldId: categoryDataFieldId(index, payField),
		category: "inconsistent",
		anchor: true,
		message: `La rémunération « ${PAY_FIELD_LABELS[payField]} » de la catégorie d'emplois n°${index + 1} est renseignée alors qu'un effectif de cette catégorie est à 0 : effacez-la ou corrigez l'effectif.`,
	}));
}

function missingPayErrors(
	category: CategoryPayValues,
	index: number,
): FieldError[] {
	const errors: FieldError[] = [];
	for (const base of CATEGORY_PAY_BASES) {
		for (const [countField, payFields] of [
			[base.womenCountField, base.womenPayFields],
			[base.menCountField, base.menPayFields],
		] as const) {
			const count = Number.parseInt(category[countField], 10);
			if (Number.isNaN(count) || count < 1) continue;
			for (const payField of payFields) {
				if (category[payField].trim() !== "") continue;
				errors.push({
					fieldId: categoryDataFieldId(index, payField),
					category: "empty",
					message: `Renseignez le ${PAY_FIELD_LABELS[payField]} pour la catégorie d'emplois n°${index + 1}.`,
					anchor: true,
				});
			}
		}
	}
	return errors;
}

export function collectCategoryPayErrors(
	categories: readonly CategoryPayValues[],
): FieldError[] {
	return categories.flatMap((category, index) =>
		// A category missing a sex on either basis declares no remuneration:
		// amounts left facing a 0 are never erased, they are refused (#3678).
		isCategoryPayApplicable(toCategoryHeadcounts(category))
			? missingPayErrors(category, index)
			: inconsistentPayErrors(category, index),
	);
}

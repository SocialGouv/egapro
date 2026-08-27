import { CATEGORY_PAY_BASES } from "~/modules/declaration-remuneration/schemas";
import type { WorkforceRowDefinition } from "../step1/workforceRows";
import { WORKFORCE_ROWS } from "../step1/workforceRows";

export type CategoryCountField = (typeof CATEGORY_PAY_BASES)[number][
	| "womenCountField"
	| "menCountField"];

export type CategoryWorkforceRowDefinition = {
	workforceRow: WorkforceRowDefinition;
	womenField: CategoryCountField;
	menField: CategoryCountField;
};

/** The category headcount rows are the step-1 rows (#4247) applied to one
 *  category: same two pay bases, same labels, category-level fields. */
export const CATEGORY_WORKFORCE_ROWS: readonly CategoryWorkforceRowDefinition[] =
	WORKFORCE_ROWS.map((workforceRow) => {
		const payBase = CATEGORY_PAY_BASES.find(
			(base) => base.basis === workforceRow.basis,
		);
		if (!payBase) {
			throw new Error(`Unknown workforce basis: ${workforceRow.basis}`);
		}
		return {
			workforceRow,
			womenField: payBase.womenCountField,
			menField: payBase.menCountField,
		};
	});

import { describe, expect, it } from "vitest";

import type { PayGapRow } from "~/modules/declaration-remuneration/types";
import { derivePayGapErrors, payGapFieldId } from "../payGapErrors";

const ROWS: PayGapRow[] = [
	{ label: "Annuelle brute moyenne", womenValue: "", menValue: "476.29" },
	{ label: "Horaire brute moyenne", womenValue: "2.72", menValue: "3.43" },
	{ label: "Annuelle brute médiane", womenValue: "443.93", menValue: "" },
];

describe("payGapFieldId", () => {
	it("numbers rows from 1 and suffixes the sex", () => {
		expect(payGapFieldId("step3-paygap", 0, "womenValue")).toBe(
			"step3-paygap-row1-f",
		);
		expect(payGapFieldId("step3-paygap", 2, "menValue")).toBe(
			"step3-paygap-row3-h",
		);
	});
});

describe("derivePayGapErrors", () => {
	it("reports one error per empty amount, naming the row and the sex", () => {
		const errors = derivePayGapErrors("step3-paygap", ROWS);

		expect(errors).toEqual([
			{
				fieldId: "step3-paygap-row1-f",
				category: "empty",
				message:
					"Renseignez le montant Annuelle brute moyenne pour les femmes.",
			},
			{
				fieldId: "step3-paygap-row3-h",
				category: "empty",
				message:
					"Renseignez le montant Annuelle brute médiane pour les hommes.",
			},
		]);
	});

	it("reports nothing when every amount is filled", () => {
		const filled = ROWS.map((row) => ({
			...row,
			womenValue: "1",
			menValue: "2",
		}));

		expect(derivePayGapErrors("step2-paygap", filled)).toEqual([]);
	});
});

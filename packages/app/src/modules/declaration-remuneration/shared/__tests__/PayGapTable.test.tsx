import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PayGapRow } from "~/modules/declaration-remuneration/types";
import { DIVERGENT_HOURLY_MEDIAN } from "~/test/gipGapFixtures";
import {
	DEFAULT_PAY_GAP_ROWS,
	handlePayGapRowChange,
	PayGapTable,
} from "../PayGapTable";

const { women, men, gap } = DIVERGENT_HOURLY_MEDIAN;

function renderTable(rows: PayGapRow[]) {
	return render(
		<PayGapTable
			caption="Écarts de rémunération"
			columnHeader="Rémunération"
			onRowChange={vi.fn()}
			rows={rows}
		/>,
	);
}

/** The row the GIP published a 7,19 % gap for, on two operands that both round to 0,10 €. */
function gipRow(overrides: Partial<PayGapRow> = {}): PayGapRow {
	return {
		label: "Horaire brute médiane",
		womenValue: women,
		menValue: men,
		gipReference: { women, men, gap },
		...overrides,
	};
}

describe("PayGapTable", () => {
	it("shows the GIP gap while both operands are untouched", () => {
		renderTable([gipRow()]);

		expect(screen.getByText("7,19 %")).toBeInTheDocument();
		expect(screen.queryByText("0,00 %")).not.toBeInTheDocument();
	});

	it("flags the row as a significant gap on the GIP value", () => {
		renderTable([gipRow()]);

		expect(screen.getByText("élevé")).toBeInTheDocument();
	});

	it("recomputes the gap once the declarant changes an operand", () => {
		renderTable([gipRow({ menValue: "0.12" })]);

		expect(screen.getByText("16,66 %")).toBeInTheDocument();
		expect(screen.queryByText("7,19 %")).not.toBeInTheDocument();
	});

	// Same operands, no GIP reference: the recomputation the fix moved away from.
	it("recomputes to a flat 0 % when no GIP reference is attached", () => {
		renderTable([gipRow({ gipReference: undefined })]);

		expect(screen.getByText("0,00 %")).toBeInTheDocument();
		expect(screen.queryByText("élevé")).not.toBeInTheDocument();
	});

	it("drops the significant-gap badge when the recomputed gap falls under the threshold", () => {
		renderTable([gipRow({ womenValue: "0.099", menValue: "0.10" })]);

		expect(screen.getByText("1,00 %")).toBeInTheDocument();
		expect(screen.queryByText("élevé")).not.toBeInTheDocument();
	});

	it("resolves each row against its own GIP reference", () => {
		renderTable([
			gipRow({ label: "Annuelle brute moyenne" }),
			gipRow({
				label: "Horaire brute moyenne",
				womenValue: "100",
				menValue: "110",
				gipReference: undefined,
			}),
		]);

		expect(screen.getByText("7,19 %")).toBeInTheDocument();
		expect(screen.getByText("9,09 %")).toBeInTheDocument();
	});

	it("reports each keystroke to the caller with the row index and field", async () => {
		const user = userEvent.setup();
		const onRowChange = vi.fn();
		render(
			<PayGapTable
				caption="Écarts de rémunération"
				columnHeader="Rémunération"
				onRowChange={onRowChange}
				rows={[gipRow({ womenValue: "", menValue: "" })]}
			/>,
		);

		await user.type(
			screen.getByLabelText("Horaire brute médiane — Hommes"),
			"5",
		);

		expect(onRowChange).toHaveBeenCalledWith(0, "menValue", "5");
	});

	it.each([
		["Femmes", "womenValue"],
		["Hommes", "menValue"],
	])("pads the %s value to two decimals when the field loses focus", async (column, field) => {
		const user = userEvent.setup();
		const onRowChange = vi.fn();
		render(
			<PayGapTable
				caption="Écarts de rémunération"
				columnHeader="Rémunération"
				onRowChange={onRowChange}
				rows={[gipRow({ womenValue: "12", menValue: "12" })]}
			/>,
		);

		await user.click(
			screen.getByLabelText(`Horaire brute médiane — ${column}`),
		);
		await user.tab();

		expect(onRowChange).toHaveBeenCalledWith(0, field, "12.00");
	});
});

describe("handlePayGapRowChange", () => {
	const rows: PayGapRow[] = [
		{ label: "Annuelle brute moyenne", womenValue: "10", menValue: "20" },
		{ label: "Horaire brute moyenne", womenValue: "30", menValue: "40" },
	];

	it("updates only the targeted row and field", () => {
		const updated = handlePayGapRowChange(rows, 1, "menValue", "50");

		expect(updated?.[1]).toEqual({
			label: "Horaire brute moyenne",
			womenValue: "30",
			menValue: "50",
		});
		expect(updated?.[0]).toEqual(rows[0]);
	});

	it("normalises the French decimal comma to a dot", () => {
		expect(
			handlePayGapRowChange(rows, 0, "womenValue", "12,50")?.[0],
		).toHaveProperty("womenValue", "12.50");
	});

	it("accepts an emptied field", () => {
		expect(
			handlePayGapRowChange(rows, 0, "womenValue", "")?.[0],
		).toHaveProperty("womenValue", "");
	});

	it("rejects a non-numeric value by returning null", () => {
		expect(handlePayGapRowChange(rows, 0, "womenValue", "abc")).toBeNull();
	});

	// A pay figure is never negative, and the minus sign would flip the gap sign.
	it("rejects a negative value by returning null", () => {
		expect(handlePayGapRowChange(rows, 0, "womenValue", "-5")).toBeNull();
	});

	it("preserves the GIP reference of the row it rewrites", () => {
		const withReference: PayGapRow[] = [gipRow()];

		const updated = handlePayGapRowChange(withReference, 0, "menValue", "0.12");

		expect(updated?.[0]?.gipReference).toEqual({ women, men, gap });
	});
});

describe("DEFAULT_PAY_GAP_ROWS", () => {
	it("declares the 4 pay-gap rows with empty operands and no GIP reference", () => {
		expect(DEFAULT_PAY_GAP_ROWS.map((r) => r.label)).toEqual([
			"Annuelle brute moyenne",
			"Horaire brute moyenne",
			"Annuelle brute médiane",
			"Horaire brute médiane",
		]);
		for (const row of DEFAULT_PAY_GAP_ROWS) {
			expect(row.womenValue).toBe("");
			expect(row.menValue).toBe("");
			expect(row.gipReference).toBeUndefined();
		}
	});
});

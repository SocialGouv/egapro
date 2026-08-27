import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	CATEGORY_NAME_MAX_LENGTH,
	CATEGORY_NAME_MAX_LENGTH_MESSAGE,
} from "~/modules/declaration-remuneration/schemas";
import type { FieldError } from "~/modules/declaration-remuneration/shared/formError/types";
import { CategoryAccordionItem } from "../CategoryAccordionItem";
import type { EmployeeCategory } from "../categorySerializer";

const category: EmployeeCategory & { id: number } = {
	id: 1,
	name: "",
	womenCount: "",
	menCount: "",
	annualBaseWomen: "",
	annualBaseMen: "",
	annualVariableWomen: "",
	annualVariableMen: "",
	hourlyBaseWomen: "",
	hourlyBaseMen: "",
	hourlyVariableWomen: "",
	hourlyVariableMen: "",
};

function renderItem(
	overrides: {
		nameError?: string;
		category?: EmployeeCategory & { id: number };
		errors?: FieldError[];
	} = {},
) {
	const { category: categoryOverride, ...rest } = overrides;
	return render(
		<CategoryAccordionItem
			baseId="cat-form"
			category={categoryOverride ?? category}
			collapseRef={vi.fn()}
			disabled={false}
			errorAlertId="category-alert"
			errors={[]}
			fieldId="field-1"
			headerRef={vi.fn()}
			index={0}
			isExpanded
			nameProps={{}}
			onAccordionToggle={vi.fn()}
			onAskRemove={vi.fn()}
			onDecimalBlur={() => vi.fn()}
			onPositiveNumberChange={() => vi.fn()}
			readOnly={false}
			readOnlyLabel={false}
			showDelete={false}
			{...rest}
		/>,
	);
}

describe("CategoryAccordionItem — name length cap (#3943)", () => {
	it("shows the max-length hint and caps the input with maxLength", () => {
		renderItem();
		expect(
			screen.getByText(CATEGORY_NAME_MAX_LENGTH_MESSAGE),
		).toBeInTheDocument();
		const input = document.getElementById("cat-0-name") as HTMLInputElement;
		expect(input).toHaveAttribute(
			"maxlength",
			String(CATEGORY_NAME_MAX_LENGTH),
		);
	});

	it("renders no error and marks the input valid when nameError is absent", () => {
		renderItem();
		const input = document.getElementById("cat-0-name") as HTMLInputElement;
		expect(input).not.toHaveAttribute("aria-invalid");
		expect(input).toHaveAttribute("aria-describedby", "cat-0-name-hint");
		expect(
			screen.queryByText(CATEGORY_NAME_MAX_LENGTH_MESSAGE, {
				selector: ".fr-error-text",
			}),
		).not.toBeInTheDocument();
	});

	it("labels the accordion header with the trimmed category name when present", () => {
		renderItem({ category: { ...category, name: "  Cadres  " } });
		expect(
			screen.getByRole("button", { name: "Catégorie d'emplois n°1 : Cadres" }),
		).toBeInTheDocument();
	});

	it("uses the shared alert for the name error state", () => {
		const message = CATEGORY_NAME_MAX_LENGTH_MESSAGE;
		renderItem({
			nameError: message,
			errors: [
				{
					fieldId: "cat-0-name",
					category: "invalid",
					message,
				},
			],
		});
		expect(document.querySelector(".fr-error-text")).toBeNull();
		const input = document.getElementById("cat-0-name") as HTMLInputElement;
		expect(input).toHaveAttribute("aria-invalid", "true");
		expect(input).toHaveAttribute(
			"aria-describedby",
			"cat-0-name-hint category-alert-invalid",
		);
	});
});

describe("CategoryAccordionItem — Total row gap (#4205)", () => {
	function totalRowGapCells() {
		return screen.getAllByRole("rowheader", { name: "Total" }).map(
			(th) =>
				within(th.parentElement as HTMLElement)
					.getAllByRole("cell")
					.at(-1) as HTMLElement,
		);
	}

	it("keeps a gap badge on base/variable rows but not on the Total row", () => {
		renderItem({
			category: {
				...category,
				annualBaseWomen: "24000",
				annualBaseMen: "25500",
				annualVariableWomen: "1200",
				annualVariableMen: "1500",
				hourlyBaseWomen: "12.50",
				hourlyBaseMen: "13.20",
				hourlyVariableWomen: "0.62",
				hourlyVariableMen: "0.78",
			},
		});

		const totalCells = totalRowGapCells();
		expect(totalCells).toHaveLength(2);
		for (const cell of totalCells) {
			expect(cell).toHaveTextContent("Non applicable");
			expect(cell).not.toHaveTextContent("%");
			expect(within(cell).queryByText("élevé")).toBeNull();
		}
	});
});

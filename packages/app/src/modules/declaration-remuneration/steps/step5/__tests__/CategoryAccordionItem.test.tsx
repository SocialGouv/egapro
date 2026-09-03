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
	hourlyWomenCount: "",
	hourlyMenCount: "",
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
		payDisabled?: boolean;
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
			payDisabled={false}
			readOnly={false}
			readOnlyLabel={false}
			showDelete={false}
			{...rest}
		/>,
	);
}

const PAY_CELL_LABELS = [
	"Salaire de base annuel femmes, catégorie 1",
	"Salaire de base annuel hommes, catégorie 1",
	"Composantes variables annuelles femmes, catégorie 1",
	"Composantes variables annuelles hommes, catégorie 1",
	"Salaire de base horaire femmes, catégorie 1",
	"Salaire de base horaire hommes, catégorie 1",
	"Composantes variables horaires femmes, catégorie 1",
	"Composantes variables horaires hommes, catégorie 1",
];

const COUNT_CELL_LABELS = [
	"Rémunération annuelle — Nombre de femmes, catégorie 1",
	"Rémunération annuelle — Nombre d'hommes, catégorie 1",
	"Rémunération horaire — Nombre de femmes, catégorie 1",
	"Rémunération horaire — Nombre d'hommes, catégorie 1",
];

describe("CategoryAccordionItem — payDisabled (#3678)", () => {
	it("leaves every cell operable when payDisabled is false", () => {
		renderItem();
		for (const label of [...PAY_CELL_LABELS, ...COUNT_CELL_LABELS]) {
			expect(screen.getByLabelText(label)).not.toBeDisabled();
		}
	});

	it("greys out the 8 pay cells and keeps the 4 headcount cells operable", () => {
		renderItem({ payDisabled: true });
		for (const label of PAY_CELL_LABELS) {
			expect(screen.getByLabelText(label)).toBeDisabled();
		}
		for (const label of COUNT_CELL_LABELS) {
			expect(screen.getByLabelText(label)).not.toBeDisabled();
		}
	});
});

describe("CategoryAccordionItem — name length cap (#3943)", () => {
	it("caps the input with maxLength and hints at the label's source (#4254)", () => {
		renderItem();
		expect(
			screen.getByText("En référence à l'accord ou à la décision unilatérale"),
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
